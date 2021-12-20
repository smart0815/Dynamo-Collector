const fetch = require('cross-fetch');
const { addOrUpdateTransactionInfo } = require('./dynamo1');

const SOLSCAN_URL_API = "https://public-api.solscan.io";
// const SOLSCAN_URL_API = "https://solana--mainnet.datahub.figment.io/apikey/ef802cd19ef5d8638c6a6cbbcd1d3144/";
const MAINNET_URL_API = "https://solana--mainnet.datahub.figment.io/apikey/ef802cd19ef5d8638c6a6cbbcd1d3144/";
const SPECIALNFT_URL_API = "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet";

async function transactionCollector(finalOutputFromCamps, key) {
	console.log(finalOutputFromCamps);
	// const account = finalOutputFromCamps.filter((entry: { symbol: undefined; }) => entry.symbol == undefined);

	for (const iterator of finalOutputFromCamps) {
		let nftMetadtacontent = await fetch(`${MAINNET_URL_API}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				"jsonrpc": "2.0",
				"id": 1,
				"method": "getTransaction",
				"params": [
					iterator.signature[0],
					"json"
				]
			})
		});

		const data = await nftMetadtacontent.json();
		if (data["result"]) {
			const index = data["result"].transaction["message"].accountKeys.indexOf(key);
			if (!iterator.symbol) {
				iterator.balance = data["result"].meta["postBalances"][index] - data["result"].meta["preBalances"][index];

				const items = [];
				let mints = await getMetadataAccount(iterator.tokenAddress);
				items.push(mints);

				let mintPubkeys = items.map(m => new PublicKey(m));
				let multipleAccounts = await connection.getMultipleAccountsInfo(mintPubkeys);
				let Metadata = multipleAccounts.filter(account => account !== null).map(account => decodeMetadata(account.data));

				for (var elem of Metadata) {
					if (elem.data.uri) {
						let nftMetadtacontent = await fetch(elem.data.uri);
						iterator.nftMetaData = await nftMetadtacontent.json();
					}
				}
			}
		}
	}

	try {
		const transactionCampsChunk = chunk(finalOutputFromCamps, 1000);
		for (const iterator of transactionCampsChunk) {
			const array = [];
			array.finalOutput = iterator;
			array.ID = new Date().getTime();
			array.address = key;
			console.log(array);
			addOrUpdateTransactionInfo(array);
		}
	} catch (err) {
		console.error(err);
		console.log('AHHHHHHHHHHH');
	}

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

function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
	transactionCollector,
};