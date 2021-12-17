// import fetch from "node-fetch";
const fetch = require('cross-fetch');
const { addOrUpdateWalletInfo } = require('./dynamo1');

let milliseconds = 11000;
const MAINNET_URL_API = "https://solana--mainnet.datahub.figment.io/apikey/ef802cd19ef5d8638c6a6cbbcd1d3144/";
const SERVER_URL_API = "http://ec2-18-191-149-176.us-east-2.compute.amazonaws.com:8080/walletCollector/";

async function getResults(before, key) {
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
				key,
				{
					"limit": 1000,
					"before": before
				}
			]
		}),
	});
	return response;
}

async function getTransaction(key) {
	let finalOutput = [];
	let i = 0;
	while (true) {
		let response;
		if (i > 0)
			response = await getResults(finalOutput.slice(-1).pop().signature, key);
		else
			response = await getResults(null, key);
		let json = await response.json();
		let result = json.result;

		if (result.length > 0) {
			finalOutput = [...finalOutput, ...result];
		} else {
			break;
		}
		i = i + 1;
	}
	console.log(finalOutput);
	let count = finalOutput.length % 2 == 0 ? finalOutput.length / 2 : finalOutput.length / 2 + 0.5;

	// collector1(finalOutput, key, count);
	fetch(`${SERVER_URL_API}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			"address": key,
			"params": finalOutput.slice(0, count)
		})
	}).catch(err => console.error(err, "mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm"));

	const firstOut = finalOutput.slice(count, finalOutput.length);
	let signatureBalance;
	let balance;
	for (const iterator of firstOut) {
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
				console.log(balance);
				index = balance["result"].transaction["message"].accountKeys.indexOf(key);
				iterator.balance = balance["result"].meta["postBalances"][index] - balance["result"].meta["preBalances"][index];
			}
		}
	}
	const array = [];
	array.finalOutput = firstOut;
	array.ID = new Date().getTime();
	array.address = key;
	console.log("earlyearlyearlyearlyearlyearlyearlyearly");
	try {
		addOrUpdateWalletInfo(array)
		console.log('nnnnnnnnnnnn');
	} catch (err) {
		console.error(err);
		console.log('AHHHHHHHHHHH');
	}

	return true;
	// return finalOutput.filter((entry) => entry.balance != undefined).reverse();
}

async function collector1(finalOutput, key, count) {
	fetch(`${SERVER_URL_API}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			"address": key,
			"params": finalOutput.slice(0, count)
		})
	}).catch(err => console.error(err));
}

function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
	getTransaction,
};

getTransaction("J3dwngT2du9yr9cEZ2n9h9SD7NnQWnwtQvySYMm81M5J");