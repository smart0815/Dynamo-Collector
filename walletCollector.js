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
	console.log('finalfinalfinalfinalfinalfinalfinalfinalfinalfinalfinalfinalfinalfinal')
	// return finalOutput.filter((entry) => entry.balance != undefined).reverse();

	try {
		const characterPromises = finalOutput.map((character, i) =>
			console.log('kkkkkkkkkkkkkkkkkkkkkkkkkk'),
			console.log(character),
			console.log('kkkkkkkkkkkkkkkkkkkkkkkkkk')
			// addOrUpdateWalletInfo({ ...character, ID:  })
		);
		await Promise.all(characterPromises);
	} catch (err) {
		console.error(err);
		console.log('AHHHHHHHHHHH');
	}
}

module.exports = {
	walletCollector,
};