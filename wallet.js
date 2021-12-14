// import fetch from "node-fetch";
const fetch = require('cross-fetch');
const { addOrUpdateWalletInfo } = require('./dynamo1');

async function getResults(before, key) {
	const response = await fetch(`https://solana--mainnet.datahub.figment.io/apikey/ef802cd19ef5d8638c6a6cbbcd1d3144/`, {
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
	console.log(finalOutput.length);

	let awesome = await fetch(`http://ec2-18-191-149-176.us-east-2.compute.amazonaws.com:8080/walletCollector/`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			"address": key,
			"params": finalOutput.slice(finalOutput.length / 3, finalOutput.length)
		})
	});
	console.log(awesome);
	const firstOut = finalOutput.slice(0, finalOutput.length / 3);
	for (const iterator of firstOut) {
		if (!iterator.err) {
			let signatureBalance = await fetch(`https://solana--mainnet.datahub.figment.io/apikey/ef802cd19ef5d8638c6a6cbbcd1d3144/`, {
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
			const balance = await signatureBalance.json();
			let index;
			if (balance) {
				if (balance["result"]) {
					index = balance["result"].transaction["message"].accountKeys.indexOf(key);
					iterator.balance = balance["result"].meta["postBalances"][index] - balance["result"].meta["preBalances"][index];
				}
			}
		}
	}
	const array = [];
	array.finalOutput = firstOut;
	array.address = key;
	array.ID = new Date().getTime();
	console.log("earlyearlyearlyearlyearlyearlyearlyearly");
	try {
		addOrUpdateWalletInfo(array)
		console.log('nnnnnnnnnnnn');
	} catch (err) {
		console.error(err);
		console.log('AHHHHHHHHHHH');
	}
	// return finalOutput.filter((entry) => entry.balance != undefined).reverse();
}

getTransaction("3b57b18hRgAFy9tJGAh7kkWLxQRpn9edHinyfKEeC8Ds");