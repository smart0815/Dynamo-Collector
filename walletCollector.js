const fetch = require('cross-fetch');

async function getTransaction(finalOutput) {

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
	console.log(finalOutput);
	return finalOutput.filter((entry) => entry.balance != undefined).reverse();
}