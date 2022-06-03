import axios from "axios";
import fetch from "node-fetch";
import AWS from 'aws-sdk';

var moralis_api_key;
var dynamoClient;
var etherscan_api_key;
var collectionField;
var collectionAddress;

const AWS_SERVER_TABLE = 'server_status';

export async function getEthereumCollectorInfo(ethereumParams) {
	moralis_api_key = ethereumParams.moraliskeyGroup;
	etherscan_api_key = ethereumParams.etherscanApikey
	collectionAddress = ethereumParams.collectionAddress;
	collectionField = ethereumParams.collectionField;

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
	updateParam.Items[0].type = 'ethereum-collection-task';

	var params = {
		TableName: AWS_SERVER_TABLE,
		Item: updateParam.Items[0],
	};

	await dynamoClient.put(params).promise();

	var finalTx = ethereumParams.params;

	for (const iterator of finalTx) {
		await getEthCorrelation(iterator.owner_of);
	}

	updateParam.Items[0].status = null;
	updateParam.Items[0].type = null;

	var params = {
		TableName: AWS_SERVER_TABLE,
		Item: updateParam.Items[0],
	};

	await dynamoClient.put(params).promise();
}

function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getEthCorrelation(accountKey) {
	let NormalTxOutput = [];
	let NftResponse;
	var StartBlockNum;

	while (true) {
		while (true) {
			try {
				NftResponse = await getAccountTxs(accountKey, StartBlockNum);
				if (NftResponse.status === 429) {
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

		if (!NftResponse) {
			console.log("getCamps failed and appending to NFTHx has been skipped");
			return;
		}

		var result = NftResponse?.result;
		if (result?.length > 0) {
			NormalTxOutput = [...NormalTxOutput, ...result];
			var number = result.slice(-1)[0].blockNumber;

			StartBlockNum = parseInt(number) + 1;
		} else {
			break;
		}
	}

	let InternalTxOutput = [];
	let InternalNftResponse;

	while (true) {
		try {
			InternalNftResponse = await getAccountInternalTxs(accountKey, 0);
			if (InternalNftResponse.status === 429) {
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

	InternalTxOutput = InternalNftResponse.result;

	let NftTxResponse;
	let NFTHx = [];
	var NFTcursor = "";

	while (true) {
		while (true) {
			try {
				NftTxResponse = await getNftTransaction(accountKey, NFTcursor);
				if (NftTxResponse.status === 429) {
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

		if (!NftTxResponse) {
			console.log("getCamps failed and appending to NFTHx has been skipped");
			return;
		}
		NFTcursor = NftTxResponse?.cursor;
		let result = NftTxResponse?.result;
		if (result?.length > 0) {
			NFTHx = [...NFTHx, ...result];
		} else {
			break;
		}
	}
	var filterbycollection = NFTHx.filter((e) => e.token_address == collectionAddress);
	for (const iterator of filterbycollection) {
		iterator.blockTime = (new Date(iterator.block_timestamp)).getTime();

		var filterOutput = [];
		filterOutput = NormalTxOutput.filter((e) => e.hash == iterator.transaction_hash);
		var transaction_filter = NFTHx.filter((e) => e.transaction_hash == iterator.transaction_hash);

		iterator.multipleCnt = transaction_filter.length;

		if (iterator.to_address.toLowerCase() == accountKey.toLowerCase()) {
			iterator.value = filterOutput.length ? parseInt(filterOutput[0].value) + parseInt(filterOutput[0].gasPrice) * parseInt(filterOutput[0].gasUsed) : 0;
			iterator.status = filterOutput.length ? parseInt(filterOutput[0].value) ? 'buy' : 'transfer' : 'transfer';
		} else if (iterator.from_address.toLowerCase() == accountKey.toLowerCase()) {
			var internal_log = InternalTxOutput.filter((e) => e.hash == iterator.transaction_hash);
			iterator.value = internal_log.length ? internal_log[0].value : 0;
			iterator.status = internal_log.length ? 'sell' : 'transfer'
		}

		if (filterOutput.length) {
			try {
				if ((filterOutput[0].input).includes('0x4a2728ab') || (filterOutput[0].input).includes('0xa0712d68') || (filterOutput[0].input).includes('0xe467f7e0') || (filterOutput[0].input).includes('0x6b3e31eb') || (filterOutput[0].input).includes('0xa2f4dc15') || (filterOutput[0].input).includes('0xbe6da4b1') || (filterOutput[0].input).includes('0x35fbd799') || (filterOutput[0].input).includes('0xe7d3fe6b') || (filterOutput[0].input).includes('0x424a991d')) {
					iterator.status = 'mint';
				}
			} catch (error) {
			}
		}

		if (iterator.from_address != accountKey) {
			iterator.correlaccount = iterator.from_address;
		} else if (iterator.to_address != accountKey) {
			iterator.correlaccount = iterator.to_address;
		}
	}

	var num = 0;
	var balanceRes;
	while (true) {
		try {
			if (num > 15) {
				num = 0;
			}
			balanceRes = await getBalanceInfo(accountKey, moralis_api_key[num]);
			if (balanceRes.status === 429 || balanceRes.message === 'Rate limit exceeded.' || balanceRes.balance === undefined) {
				num++;
				await delay(5000); // Before re-trying the next loop cycle, let's wait 5 seconds (5000ms)
				continue;
			} else {
				break;
			}
		} catch {
			num++;
			await delay(5000);
			continue;
		}
	}

	const chunks = chunk(filterbycollection, 200);
	for (const iterator of chunks) {
		const array = [];
		array.ID = new Date().getTime();
		array.walletAddress = accountKey;
		array.balance = balanceRes.balance;
		array.nftHx = iterator;

		await addOrUpdateCharacter(array, collectionField);
	}
}

const addOrUpdateCharacter = async (character, table_name) => {
	const params = {
		TableName: table_name,
		Item: character,
	};
	return await dynamoClient.put(params).promise();
};

const getNftTransaction = async (accountKey, cursor) => {
	var getNftInfo = await fetch(`https://deep-index.moralis.io/api/v2/${accountKey}/nft/transfers?chain=eth&format=decimal&direction=both&cursor=${cursor}`, {
		"method": "GET",
		"headers": {
			"accept": "application/json",
			"X-API-Key": moralis_api_key[0]
		}
	});

	return getNftInfo.json();
}

const getAccountInternalTxs = async (accountKey, offset) => {
	var getNftInfo = await fetch(`https://api.etherscan.io/api?module=account&action=txlistinternal&address=${accountKey}&apikey=HMU8UGIJQXPKT2BGNCG82IX7RMHUQNXAZC&offset=${offset}`, {
		"method": "GET",
		"headers": {
			"accept": "application/json",
		}
	});

	return getNftInfo.json();
}

const getAccountTxs = async (accountKey, startBlock) => {
	var getNftInfo = await fetch(`https://api.etherscan.io/api?module=account&action=txlist&address=${accountKey}&startblock=${startBlock}&endblock=99999999&page=1&offset=10000&sort=asc&apikey=${etherscan_api_key}`, {
		"method": "GET",
		"headers": {
			"accept": "application/json",
		}
	});

	return getNftInfo.json();
}


const getBalanceInfo = async (walletAddress, moraliskey) => {
	var balance = await fetch(`https://deep-index.moralis.io/api/v2/${walletAddress}/balance?chain=eth`, {
		"method": "GET",
		"headers": {
			"accept": "application/json",
			"X-API-Key": moraliskey
		}
	});

	return balance.json();
}

function chunk(array, size) {
	if (size <= 0 || !Number.isInteger(size)) {
		throw new Error(`Expected size to be an integer greater than 0 but found ${size}`);
	}
	if (array.length === 0) {
		return [];
	}
	const ret = new Array(Math.ceil(array.length / size));
	let readIndex = 0;
	let writeIndex = 0;
	while (readIndex < array.length) {
		ret[writeIndex] = array.slice(readIndex, readIndex + size);
		writeIndex += 1;
		readIndex += size;
	}
	return ret;
}