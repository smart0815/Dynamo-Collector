import fetch from "node-fetch";
import { addOrUpdateWalletInfo, updateFlagStatus } from './dynamo1.js';
import { decodeMetadata, getMetadataAccount } from "./Metadata.service.js";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
let connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');
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
							let nftMetadtacontent = await fetch(elem.data.uri);
							console.log(elem.data.uri);
							try {
								iterator.nftMetaData = await nftMetadtacontent.text();
							} catch {
								console.log('llllllllllll');
								break;
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
				index = balance["result"]?.transaction["message"].accountKeys.indexOf(key);
				iterator.balance = balance["result"]?.meta["postBalances"][index] - balance["result"]?.meta["preBalances"][index];
			}
		}
	}
	// return finalOutput.filter((entry) => entry.balance != undefined).reverse();
	try {
		const chunks = chunk(finalOutput, 200);
		for (const iterator of chunks) {
			const array = [];
			array.finalOutput = JSON.parse(JSON.stringify(iterator));
			array.ID = new Date().getTime();
			array.address = key;
			addOrUpdateWalletInfo(array);
		}

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