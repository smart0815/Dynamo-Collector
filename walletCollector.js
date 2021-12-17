const fetch = require('cross-fetch');
const { addOrUpdateWalletInfo } = require('./dynamo1');

let milliseconds = 11000;
const MAINNET_URL_API = "https://solana--mainnet.datahub.figment.io/apikey/ef802cd19ef5d8638c6a6cbbcd1d3144/";

async function walletCollector(finalOutput, key) {
	console.log('here')
	let signatureBalance;
	let balance;
	for (const iterator of finalOutput) {
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
	array.finalOutput = finalOutput;
	array.ID = new Date().getTime();
	array.address = key;
	// console.log(array);
	// return finalOutput.filter((entry) => entry.balance != undefined).reverse();
	try {
		// const characterPromises = array.map((character, i) =>
		addOrUpdateWalletInfo(array)
		// addOrUpdateWalletInfo({ ...character, ID: i + '' })
		// );
		console.log('nnnnnnnnnnnn');
		// await Promise.all(characterPromises);
	} catch (err) {
		console.error(err);
		console.log('AHHHHHHHHHHH');
	}
}

function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
	walletCollector,
};