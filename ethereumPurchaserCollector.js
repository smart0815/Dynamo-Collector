import axios from "axios";
import fetch from "node-fetch";
import AWS from 'aws-sdk';

var moralis_api_key;
var nftInfo;
var dynamoClient;
var collectionTable;

const AWS_SERVER_TABLE = 'server_status';
const getHash = async (accountKey, num, offset) => {
	var hash = await fetch(`https://deep-index.moralis.io/api/v2/nft/${accountKey}/${num}/transfers?chain=eth&format=decimal&offset=${offset}`, {
		"method": "GET",
		"headers": {
			"accept": "application/json",
			"X-API-Key": moralis_api_key
		}
	});

	return hash;
}

const getTransaction = async (hash) => {
	var getHashInfo = await fetch(`https://deep-index.moralis.io/api/v2/transaction/${hash}?chain=eth`, {
		"method": "GET",
		"headers": {
			"accept": "application/json",
			"X-API-Key": moralis_api_key
		}
	});

	return getHashInfo.json();
}

const getUsersHistory = async (accountKey, fromTime, toTime, offset) => {
	var getUserHistoryInfo = await fetch(`https://deep-index.moralis.io/api/v2/${accountKey}?chain=eth&from_date=${fromTime}&to_date=${toTime}&offset=${offset}`, {
		"method": "GET",
		"headers": {
			"accept": "application/json",
			"X-API-Key": moralis_api_key
		}
	});

	return getUserHistoryInfo;
}

export async function getEthereumPurchaserCollector(ethereumParams) {
	moralis_api_key = ethereumParams.moraliskey;
	nftInfo = ethereumParams.accountkey;
	collectionTable = ethereumParams.collectionTable;

	AWS.config.update({
		region: ethereumParams.region,
		accessKeyId: ethereumParams.accessKeyId,
		secretAccessKey: ethereumParams.secretAccessKey,
	});

	dynamoClient = new AWS.DynamoDB.DocumentClient();

	var params = {
		TableName: AWS_SERVER_TABLE,
		KeyConditionExpression: "#cat = :findValue",
		FilterExpression: '#cat = :findValue',
		ExpressionAttributeNames: {
			'#cat': 'server',
		},
		ExpressionAttributeValues: {
			':findValue': ethereumParams.server,
		},
	};

	var updateParam = await dynamoClient.scan(params).promise();

	updateParam.Items[0].status = 'running';
	updateParam.Items[0].type = 'ethereum-purchaser-task';

	var params = {
		TableName: AWS_SERVER_TABLE,
		Item: updateParam.Items[0],
	};

	await dynamoClient.put(params).promise();

	var finalTx = ethereumParams.params;

	for (const iterator of finalTx) {
		await getPurchaserfunc(iterator.token_id, iterator.name, iterator.token_uri, iterator.contract_type, iterator.metadata);
	}

	updateParam.Items[0].status = null;
	updateParam.Items[0].type = null;

	var params = {
		TableName: AWS_SERVER_TABLE,
		Item: updateParam.Items[0],
	};

	await dynamoClient.put(params).promise();
}

const getPurchaserfunc = async (token_id, nftName, nftUrl, contractType, metadata) => {
	try {
		let finalPurchaserHash = [];
		let i = 0;
		while (true) {
			const getHashs = async () => await getHash(nftInfo, token_id, i * 500); // This is an arrow function for re-usability
			let hashResponse;
			for (let i = 0; i < 5; i++) {
				try {
					hashResponse = await getHashs();

					if (hashResponse.status === 429) {
						await delay(11000); // Before re-trying the next loop cycle, let's wait 5 seconds (5000ms)
						continue;
					} else {
						break;
					}
				} catch {
					await delay(11000);
					continue;
				}
			}

			if (!hashResponse) {
				console.log("getCamps failed and appending to finalPurchaserHash has been skipped");
				return;
			}
			let json = await hashResponse?.json();
			let result = json?.result;
			if (result?.length > 0) {
				finalPurchaserHash = [...finalPurchaserHash, ...result];
			} else {
				break;
			}
			i++; // equals to : i = i + 1;
		}
		const firstTransaction = finalPurchaserHash.slice(-1).pop();
		const secondTransaction = finalPurchaserHash.slice(-2, -1).pop() ? finalPurchaserHash.slice(-2, -1).pop() : firstTransaction;
		const thirdTransaction = finalPurchaserHash.slice(-3, -2).pop() ? finalPurchaserHash.slice(-3, -2).pop() : secondTransaction;
		const fourthTransaction = finalPurchaserHash.slice(-4, -3).pop() ? finalPurchaserHash.slice(-4, -3).pop() : thirdTransaction;

		await updateTransaction(token_id, nftName, nftUrl, metadata, finalPurchaserHash.length, contractType, firstTransaction, secondTransaction, thirdTransaction, fourthTransaction);
	} catch (error) {
		console.log("Ups!! An error was caught", error);
	}
}

const updateTransaction = async (token_id, nftName, nftUrl, metadata, transactionLen, contractType, firstTransaction, secondTransaction, thirdTransaction, fourthTransaction) => {
	const firstHashInfo = await getTransaction(firstTransaction.transaction_hash);
	const secondHashInfo = await getTransaction(secondTransaction.transaction_hash);
	const thirdHashInfo = await getTransaction(thirdTransaction.transaction_hash);
	const fourthHashInfo = await getTransaction(fourthTransaction.transaction_hash);

	const tokenBalance = firstHashInfo.value;
	var detectPurchaser;

	if (firstHashInfo.from_address == secondHashInfo.from_address) {
		if (firstHashInfo.from_address == thirdHashInfo.from_address) {
			if (firstHashInfo.from_address == fourthHashInfo.from_address) {
			} else {
				if (Math.abs(fourthHashInfo.value) < Math.abs(tokenBalance)) {
					detectPurchaser = fourthHashInfo.from_address;
				}
			}
		} else {
			if (Math.abs(thirdHashInfo.value) < Math.abs(tokenBalance)) {
				detectPurchaser = thirdHashInfo.from_address;
			}
		}
	} else {
		if (Math.abs(secondHashInfo.value) < Math.abs(tokenBalance)) {
			detectPurchaser = secondHashInfo.from_address;
		}
	}

	var blockTime = (new Date(firstHashInfo.block_timestamp)).getTime();
	var firstPurchaser = firstHashInfo.from_address;

	let fristPurchaserInfo = [];
	let k = 0;
	while (true) {
		const getPurchaserHistory = async () => await getUsersHistory(firstPurchaser, new Date(blockTime - 86400000).toISOString(), firstHashInfo.block_timestamp, k * 500); // This is an arrow function for re-usability
		let purchaserResponse;
		for (let i = 0; i < 5; i++) {
			try {
				purchaserResponse = await getPurchaserHistory();

				if (purchaserResponse.status === 429) {
					await delay(11000); // Before re-trying the next loop cycle, let's wait 5 seconds (5000ms)
					continue;
				} else {
					break;
				}
			} catch {
				await delay(11000);
				continue;
			}
		}

		if (!purchaserResponse) {
			console.log("getCamps failed and appending to fristPurchaserInfo has been skipped");
			return;
		}
		let json = await purchaserResponse?.json();
		let result = json?.result;
		if (result?.length > 0) {
			fristPurchaserInfo = [...fristPurchaserInfo, ...result];
		} else {
			break;
		}
		k++; // equals to : i = i + 1;
	}

	const detectAccount = fristPurchaserInfo.filter((entry) => entry.src == detectPurchaser);
	let _sold, _buy, _price;
	_sold = 0;
	_buy = 0;
	for (const iterator of detectAccount) {
		if (iterator.from_address == detectPurchaser) {
			_buy += parseInt(iterator.value);
		} else {
			_sold += parseInt(iterator.value);
		}
	}
	_price = _buy - _sold;

	if (Math.abs(_price) < Math.abs(tokenBalance)) {
		detectPurchaser = undefined;
	}

	var nftMetaData;

	if (metadata) {
		nftMetaData = metadata;
	} else {
		var imageData = await fetch(`${nftUrl}`, {
			"method": "GET",
			"headers": {
				"accept": "application/json",
			}
		});
		nftMetaData = await imageData.json();
	}

	const array = [];
	array.ID = new Date().getTime();
	array.token = token_id;
	array.firstPurchaser = firstPurchaser;
	array.detectPurchaser = detectPurchaser ? detectPurchaser : firstPurchaser;
	array.transactions = transactionLen;
	array.contractType = contractType;
	array.blockTime = blockTime;
	array.price = tokenBalance;
	array.nftMetaData = nftMetaData;
	array.nftMetaDataName = nftName + ' #' + token_id;
	array.nftMetaDataImg = nftMetaData.image_small ? nftMetaData.image_small : nftMetaData.image;
	array.collection = nftName;
	array.collectionkey = nftInfo;

	await addOrUpdateCharacter(array, collectionTable);
}

function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

const addOrUpdateCharacter = async (character, table_name) => {
	const params = {
		TableName: table_name,
		Item: character,
	};
	return await dynamoClient.put(params).promise();
};