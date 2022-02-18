import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';

import fetch from "node-fetch";
import { decodeMetadata, getMetadataAccount } from "./Metadata.service.js";

// const MAINNET_URL_API = "https://solana--mainnet.datahub.figment.io/apikey/ef802cd19ef5d8638c6a6cbbcd1d3144/";
const MAINNET_URL_API = "https://api.mainnet-beta.solana.com";
const SOLSCAN_URL_API = "https://api.solscan.io";

const connection = new Connection("https://api.metaplex.solana.com");
const milliseconds = 11000;

const PURCHASER_TABLE = 'purchaser_info';
const AWS_SERVER_TABLE = 'server_status';

var dynamoClient;

export async function purchaserCollector(purchaserParam) {

	AWS.config.update({
		region: purchaserParam.region,
		accessKeyId: purchaserParam.accessKeyId,
		secretAccessKey: purchaserParam.secretAccessKey,
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
			':findValue': purchaserParam.server,
		},
	};

	var updateParam = await dynamoClient.scan(params).promise();

	updateParam.Items[0].status = 'running';
	updateParam.Items[0].type = 'purchaser-data-task';

	var params = {
		TableName: AWS_SERVER_TABLE,
		Item: updateParam.Items[0],
	};

	await dynamoClient.put(params).promise();

	var finalOutput = purchaserParam.params;
	for (const iterator of finalOutput) {
		await getSignature(iterator);
	}

	updateParam.Items[0].status = null;
	updateParam.Items[0].type = null;

	var params = {
		TableName: AWS_SERVER_TABLE,
		Item: updateParam.Items[0],
	};

	await dynamoClient.put(params).promise();
};

const getSignature = async (token) => {
	try {
		const response = await fetch(`${MAINNET_URL_API}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				"jsonrpc": "2.0",
				"id": 2,
				"method": "getSignaturesForAddress",
				"params": [
					token,
					{
						"limit": 1000
					}
				]
			}),
		});
		const transaction = await response.json();
		const firstTransaction = transaction["result"].slice(-1).pop().signature;
		const secondTransaction = transaction["result"].slice(-2, -1).pop() ? transaction["result"].slice(-2, -1).pop().signature : firstTransaction;
		const thirdTransaction = transaction["result"].slice(-3, -2).pop() ? transaction["result"].slice(-3, -2).pop().signature : secondTransaction;
		const fourthTransaction = transaction["result"].slice(-4, -3).pop() ? transaction["result"].slice(-4, -3).pop().signature : thirdTransaction;

		await getCamps(token, transaction["result"].length, firstTransaction, secondTransaction, thirdTransaction, fourthTransaction);
	} catch (error) {
		console.log("Ups!! An error was caught", error);
	}
}

const getSol = async (token, offset, blockTime, fromTime) => {
	return await fetch(`${SOLSCAN_URL_API}/account/soltransfer/txs?address=${token}&fromTime=${blockTime - fromTime * 86400000}&toTime=${blockTime}&offset=${offset}&limit=10`, {
		method: "GET",
		headers: {
			'Content-Type': 'application/json'
		}
	});
}

const getCamps = async (token, num, firstSignature, secondSignature, thirdSignature, fourthSignature) => {
	const firstResponse = await fetch(`${MAINNET_URL_API}`, {
		method: "POST",
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			"jsonrpc": "2.0",
			"id": 1,
			"method": "getTransaction",
			"params": [
				firstSignature,
				"json"
			]
		})
	});
	const firstTransaction = await firstResponse.json();
	let finalOutputFromCamps = [];
	const secondResponse = await fetch(`${MAINNET_URL_API}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			"jsonrpc": "2.0",
			"id": 1,
			"method": "getTransaction",
			"params": [
				secondSignature,
				"json"
			]
		})
	});
	const secondTransaction = await secondResponse.json();
	const secondIndex = secondTransaction["result"].transaction["message"].accountKeys.indexOf(secondTransaction["result"].transaction.message.accountKeys[0]);
	const secondBalance = secondTransaction["result"].meta["postBalances"][secondIndex] - secondTransaction["result"].meta["preBalances"][secondIndex];

	const thirdResponse = await fetch(`${MAINNET_URL_API}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			"jsonrpc": "2.0",
			"id": 1,
			"method": "getTransaction",
			"params": [
				thirdSignature,
				"json"
			]
		})
	});
	const thirdTransaction = await thirdResponse.json();
	const thirdIndex = thirdTransaction["result"].transaction["message"].accountKeys.indexOf(thirdTransaction["result"].transaction.message.accountKeys[0]);
	const thirdBalance = thirdTransaction["result"].meta["postBalances"][thirdIndex] - thirdTransaction["result"].meta["preBalances"][thirdIndex];

	const fourthResponse = await fetch(`${MAINNET_URL_API}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			"jsonrpc": "2.0",
			"id": 1,
			"method": "getTransaction",
			"params": [
				fourthSignature,
				"json"
			]
		})
	});
	const fourthTransaction = await fourthResponse.json();
	const fourthIndex = fourthTransaction["result"].transaction["message"].accountKeys.indexOf(fourthTransaction["result"].transaction.message.accountKeys[0]);
	const fourthBalance = fourthTransaction["result"].meta["postBalances"][fourthIndex] - fourthTransaction["result"].meta["preBalances"][fourthIndex];

	let detectPurchaser;
	let balance;
	if (firstTransaction["result"].transaction.message.accountKeys[0] == secondTransaction["result"].transaction.message.accountKeys[0]) {
		if (firstTransaction["result"].transaction.message.accountKeys[0] == thirdTransaction["result"].transaction.message.accountKeys[0]) {
			if (firstTransaction["result"].transaction.message.accountKeys[0] == fourthTransaction["result"].transaction.message.accountKeys[0]) {
			} else {
				if (Math.abs(fourthBalance) < 10000000) {
					detectPurchaser = fourthTransaction["result"].transaction.message.accountKeys[0];
					balance = fourthBalance;
				}
			}
		} else {
			if (Math.abs(thirdBalance) < 10000000) {
				detectPurchaser = thirdTransaction["result"].transaction.message.accountKeys[0];
				balance = thirdBalance;
			}
		}
	} else {
		if (Math.abs(secondBalance) < 10000000) {
			detectPurchaser = secondTransaction["result"].transaction.message.accountKeys[0];
			balance = secondBalance;
		}
	}

	if (detectPurchaser) {
		let i = 0;
		while (true) {
			const accountKey = firstTransaction.result.transaction.message.accountKeys[0];
			const getResponseSol = async () => await getSol(accountKey, i * 10, firstTransaction.result.blockTime, 3); // This is an arrow function for re-usability
			let response;

			for (let i = 0; i < 5; i++) {
				try {
					response = await getResponseSol();
					if (response.status === 429) {
						await delay(milliseconds); // Before re-trying the next loop cycle, let's wait 5 seconds (5000ms)
						continue;
					} else {
						break;
					}
				} catch {
					await delay(milliseconds);
					continue;
				}
			}

			if (!response) {
				console.log("getCamps failed and appending to finalOutputFromCamps has been skipped");
				return;
			}
			let json = await response?.json();
			let result = json?.data?.tx?.transactions;
			if (result?.length > 0) {
				finalOutputFromCamps = [...finalOutputFromCamps, ...result];
			} else {
				break;
			}
			i++; // equals to : i = i + 1;
			if (accountKey == 'F7Do32qyoFAGof4LaeU5gHEiZYz8wfFAgogbmGXdczqE') {
				if (i > 2) {
					break;
				}
			}
		}

		const detectAccount = finalOutputFromCamps.filter((entry) => entry.src == detectPurchaser);

		let _sold, _buy, _price;
		_sold = 0;
		_buy = 0;
		for (const iterator of detectAccount) {
			if (iterator.src == detectPurchaser) {
				_buy += iterator.lamport;
			} else if (iterator.src == firstTransaction["result"].transaction.message.accountKeys[0]) {
				_sold += iterator.lamport;
			}
		}
		_price = _buy - _sold;

		if (_price < 9000000) {
			detectPurchaser = undefined;
		}
	}

	const items = [];
	let mints = await getMetadataAccount(token);
	items.push(mints);

	let mintPubkeys = items.map(m => new PublicKey(m));
	let multipleAccounts = await connection.getMultipleAccountsInfo(mintPubkeys);
	let Metadata = multipleAccounts.filter(account => account !== null).map(account => decodeMetadata(account?.data));
	let nftMetaData;

	for (var elem of Metadata) {
		if (elem?.data.uri) {
			let nftMetadtacontent = await fetch(elem.data.uri);
			nftMetaData = await nftMetadtacontent.json();
		}
	}

	const array = [];
	array.ID = new Date().getTime();
	array.token = token,
		array.firstPurchaser = firstTransaction["result"].transaction.message.accountKeys[0],
		array.detectPurchaser = detectPurchaser ? detectPurchaser : firstTransaction["result"].transaction.message.accountKeys[0],
		array.transactions = num,
		array.blockTime = firstTransaction["result"].blockTime,
		array.nftMetaDataName = nftMetaData.name,
		array.nftMetaDataImg = nftMetaData.image,
		array.nftMetaData = nftMetaData

	addOrUpdatePurchaserInfo(array);
}

const addOrUpdatePurchaserInfo = async (character) => {
	const params = {
		TableName: PURCHASER_TABLE,
		Item: character,
	};

	return await dynamoClient.put(params).promise();
};

function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

getMintAddresses();