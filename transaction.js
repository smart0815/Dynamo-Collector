const fetch = require('cross-fetch');
const { addOrUpdateTransactionInfo } = require('./dynamo1');

const SOLSCAN_URL_API = "https://public-api.solscan.io";
// const SOLSCAN_URL_API = "https://solana--mainnet.datahub.figment.io/apikey/ef802cd19ef5d8638c6a6cbbcd1d3144/";
const MAINNET_URL_API = "https://solana--mainnet.datahub.figment.io/apikey/ef802cd19ef5d8638c6a6cbbcd1d3144/";
const SPECIALNFT_URL_API = "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet";
const SERVER_URL_API = "http://ec2-18-191-149-176.us-east-2.compute.amazonaws.com:8080/transactionCollector/";

let milliseconds = 11000;

const getSol = async (token, offset) => {
	return await fetch(`${SOLSCAN_URL_API}/account/splTransfers?account=${token}&offset=${offset}&limit=50`, {
		method: "GET",
		headers: {
			'accept': 'application/json'
		}
	});
}

async function transactionInfo(key) {
	let i = 0;
	let finalOutputFromCamps = [];

	while (true) {
		const getResponseSol = async () => await getSol(key, i * 50); // This is an arrow function for re-usability
		let response;
		// Retry 5 times.
		// If getResponseSol throws an error, await 5seconds and re-try
		// If getResponseSol throws a 429, await 5seconds and re-try.
		//
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
		// If we didn't get any response from the retries, then let's skip this execution
		// @ts-ignore
		if (!response) {
			console.log("getCamps failed and appending to finalOutputFromCamps has been skipped");
			return;
		}
		
		console.log('nmm,nmnnmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm')
		console.log(response);
		console.log(response.body);
		console.log(response.send(respopnse.body));
		console.log('nmm,nmnnmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm')
		let json = await response.json();
		let result = json.data;
		if (result.length > 0) {
			finalOutputFromCamps = [...finalOutputFromCamps, ...result];
		} else {
			break;
		}
		i++; // equals to : i = i + 1;
	}

	let count = finalOutputFromCamps.length % 2 == 0 ? finalOutputFromCamps.length / 2 : finalOutputFromCamps.length / 2 + 0.5;
	console.log(count);
	fetch(`${SERVER_URL_API}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			"address": key,
			"params": finalOutputFromCamps.slice(0, count)
		})
	}).catch(err => console.error(err, ""));

	console.log(finalOutputFromCamps);
	// const account = finalOutputFromCamps.filter((entry: { symbol: undefined; }) => entry.symbol == undefined);

	const transactionCamps = finalOutputFromCamps.slice(count, finalOutput.length);

	for (const iterator of transactionCamps) {
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
		const transactionCampsChunk = chunk(transactionCamps, 1000);
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

	return true;
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

transactionInfo('3b57b18hRgAFy9tJGAh7kkWLxQRpn9edHinyfKEeC8Ds');

module.exports = {
	transactionInfo,
};