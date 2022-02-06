import fetch from "node-fetch";
import AWS from 'aws-sdk';

import { decodeMetadata, getMetadataAccount } from "./Metadata.service.js";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
let connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');
let milliseconds = 11000;
const MAINNET_URL_API = "https://solana--mainnet.datahub.figment.io/apikey/ef802cd19ef5d8638c6a6cbbcd1d3144/";

const AWS_SERVER_TABLE = 'server_status';
const WALLET_TABLE = 'Wallet_history';

export async function walletCollector(walletParams) {
	console.log(walletParams);
	AWS.config.update({
		region: walletParams.region,
		accessKeyId: walletParams.accessKeyId,
		secretAccessKey: walletParams.secretAccessKey,
	});

	const dynamoClient = new AWS.DynamoDB.DocumentClient();

	var params = {
		TableName: AWS_SERVER_TABLE,
		KeyConditionExpression: "#cat = :findValue",
		FilterExpression: '#cat = :findValue',
		ExpressionAttributeNames: {
			'#cat': 'server',
		},
		ExpressionAttributeValues: {
			':findValue': walletParams.server,
		},
	};

	var updateParam = await dynamoClient.scan(params).promise();
	console.log(updateParam);
	updateParam.Items[0].status = 'running';
	updateParam.Items[0].type = 'wallet-data-task';

	var params = {
		TableName: AWS_SERVER_TABLE,
		Item: updateParam.Items[0],
	};
	console.log('putput');
	await dynamoClient.put(params).promise();

	let signatureBalance;
	let balance;
	var number;
	number = 0;
	console.log('here');
	var finalOutput = walletParams.params;
	for (const iterator of finalOutput) {
		number++
		console.log(number);
		if (!iterator.err) {
			for (let i = 0; i < 4; i++) {
				try {
					signatureBalance = await fetch(`${MAINNET_URL_API}`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							"jsonrpc": "2.0",
							"id": 1,
							"method": "getTransaction",
							"params": [
								iterator.signature,
								"json"
							]
						})
					});
					balance = await signatureBalance.json();
					if (balance.result === null) {
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
			let index;
			if (balance) {
				if (balance["result"]?.meta["postTokenBalances"]?.length) {
					const items = [];
					console.log(balance["result"].meta["postTokenBalances"][0].mint);
					let mints = await getMetadataAccount(balance["result"].meta["postTokenBalances"][0].mint);
					items.push(mints);
					iterator.token = balance["result"].meta["postTokenBalances"][0].mint;
					let mintPubkeys = items.map(m => new PublicKey(m));
					let multipleAccounts = await connection.getMultipleAccountsInfo(mintPubkeys);
					let Metadata = multipleAccounts.filter(account => account !== null).map(account => decodeMetadata(account.data));
					for (var elem of Metadata) {
						if (elem?.data.uri) {
							if (!elem.data.uri.includes("details.txt")) {
								let nftMetadtacontent = await fetch(elem.data.uri);
								console.log(elem.data.uri);
								iterator.nftMetaData = await nftMetadtacontent.text();
							}
						}
						else {
							iterator.symbol = elem.data.symbol;
							const postTokenBalance = balance["result"].meta["postTokenBalances"].filter(account => account.accountIndex == 1);
							const preTokenBalance = balance["result"].meta["preTokenBalances"].filter(account => account.accountIndex == 1);
							let postTokenBalancePrice;
							let preTokenBalancePrice;
							if (postTokenBalance.length) {
								postTokenBalancePrice = postTokenBalance ? postTokenBalance[0]["uiTokenAmount"].uiAmount : 0;
							}
							if (preTokenBalance.length) {
								preTokenBalancePrice = preTokenBalance ? preTokenBalance[0]["uiTokenAmount"].uiAmount : 0;
							}
							iterator.coinPrice = postTokenBalancePrice ? postTokenBalancePrice : 0 - preTokenBalancePrice ? preTokenBalancePrice : 0;
							if (iterator.coinPrice) {
								iterator.unit = elem.data.symbol;
							}
						}
					}
				}
				index = balance["result"]?.transaction["message"].accountKeys.indexOf(walletParams.address);
				iterator.balance = balance["result"]?.meta["postBalances"][index] - balance["result"]?.meta["preBalances"][index];

				if (iterator.balance < 0) {
					for (var k = 1; k < balance["result"].transaction["message"].accountKeys.length; k++) {
						var bal = balance["result"].meta["postBalances"][k] - balance["result"].meta["preBalances"][k];
						if (bal * 0.000000001 != 0.00203928 && bal * 0.000000001 != -0.00203928 && bal * 0.000000001 != 0.0014616 && bal * 0.000000001 != -0.0014616 && bal != 0) {
							console.log(balance["result"].transaction["message"].accountKeys[k]);
							iterator.correlaccount = balance["result"].transaction["message"].accountKeys[k];
						}
					}
				} else if (iterator.balance > 0) {
					for (var lj = index; lj > 0; lj--) {
						var bal = balance["result"].meta["postBalances"][lj] - balance["result"].meta["preBalances"][lj];
						if (bal * 0.000000001 != 0.00203928 && bal * 0.000000001 != -0.00203928 && bal * 0.000000001 != 0.0014616 && bal * 0.000000001 != -0.0014616 && bal != 0) {
							console.log(balance["result"].transaction["message"].accountKeys[lj]);
							iterator.correlaccount = balance["result"].transaction["message"].accountKeys[lj];
						}
					}
				}
			}
		}
	}

	try {
		const chunks = chunk(finalOutput, 200);
		for (const iterator of chunks) {
			const array = [];
			array.finalOutput = JSON.parse(JSON.stringify(iterator));
			array.ID = new Date().getTime();
			array.address = walletParams.address;
			var params = {
				TableName: WALLET_TABLE,
				Item: array,
			};
			await dynamoClient.put(params).promise();
		}
		console.log(updateParam);
		updateParam.Items[0].status = 'null';
		updateParam.Items[0].type = 'null';

		var params = {
			TableName: AWS_SERVER_TABLE,
			Item: updateParam.Items[0],
		};

		console.log('putput');
		await dynamoClient.put(params).promise();
		// await updateServerStatus(walletParams.server, 'running', 'wallet-data-task');

	} catch (err) {
		console.error(err);
	}
}

function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
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

const updateServerStatus = async (serverUrl, status, statusType) => {
	var params = {
		TableName: TASK_TABLE,
		KeyConditionExpression: "#cat = :findValue",
		FilterExpression: '#cat = :findValue',
		ExpressionAttributeNames: {
			'#cat': 'server',
		},
		ExpressionAttributeValues: {
			':findValue': serverUrl,
		},
	};

	var updateParam = await dynamoClient.scan(params).promise();
	updateParam.Items[0].status = status;
	updateParam.Items[0].type = statusType;

	addUpdateTask(updateParam.Items[0]);
};

const addOrUpdateWalletInfo = async (character) => {
	var params = {
		TableName: WALLET_TABLE,
		Item: character,
	};
	return await dynamoClient.put(params).promise();
};