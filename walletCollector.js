const fetch = require('cross-fetch');
const { addOrUpdateWalletInfo } = require('./dynamo1');

async function walletCollector(finalOutput, key) {
	console.log('here')
	for (const iterator of finalOutput) {
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
	array.finalOutput = finalOutput;
	array.address = key;
	array.ID = new Date().getTime();
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

module.exports = {
	walletCollector,
};