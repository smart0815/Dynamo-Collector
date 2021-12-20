import fetch from "node-fetch";
import { addOrUpdateWalletInfo } from './dynamo1.js';

let milliseconds = 11000;
const MAINNET_URL_API = "https://solana--mainnet.datahub.figment.io/apikey/ef802cd19ef5d8638c6a6cbbcd1d3144/";

export async function walletCollector(finalOutput, key) {
	console.log(key);
	console.log('here')
	let signatureBalance;
	let balance;
	var number;
	number = 0;
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
				index = balance["result"].transaction["message"].accountKeys.indexOf(key);
				iterator.balance = balance["result"].meta["postBalances"][index] - balance["result"].meta["preBalances"][index];
			}
		}
	}
	// return finalOutput.filter((entry) => entry.balance != undefined).reverse();
	try {
		const chunks = chunk(finalOutput, 1000);
		for (const iterator of chunks) {
			const array = [];
			array.finalOutput = iterator;
			array.ID = new Date().getTime();
			array.address = key;
			addOrUpdateWalletInfo(array);

			// flag status
			var arr = [];
			arr.ID = 1;
			arr.Flag = true;
			updateFlagStatus(arr);
		}
		updateTaskInfo(key);
		console.log('nnnnnnnnnnnn');
	} catch (err) {
		console.error(err);
		console.log('AHHHHHHHHHHH');
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