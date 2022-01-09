import fetch from "node-fetch";
import { addOrUpdateWalletInfo, updateTaskInfo, updateFlagStatus } from './dynamo1.js';

import { decodeMetadata, getMetadataAccount } from "./Metadata.service.js";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
let connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');
let milliseconds = 11000;
const MAINNET_URL_API = "https://solana--mainnet.datahub.figment.io/apikey/ef802cd19ef5d8638c6a6cbbcd1d3144/";
const SERVER_URL_API = "http://ec2-18-191-149-176.us-east-2.compute.amazonaws.com:8080/walletCollector/";
const SERVER1_URL_API = "http://ec2-3-144-143-163.us-east-2.compute.amazonaws.com:8080/walletCollector/";
const SERVER2_URL_API = "http://ec2-3-143-216-232.us-east-2.compute.amazonaws.com:8080/walletCollector/";

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

export async function getWalletInfo(key, preLen) {
	// const items = [];
	// let mints = await getMetadataAccount('6KHyd1MscUdXVeCpmEoANt33o7dQh9u25iTeek6hRYsP');
	// items.push(mints);
	// let mintPubkeys = items.map(m => new PublicKey(m));
	// let multipleAccounts = await connection.getMultipleAccountsInfo(mintPubkeys);
	// let Metadata = multipleAccounts.filter(account => account !== null).map(account => decodeMetadata(account.data));
	// console.log(Metadata);
	// for (var elem of Metadata) {
	// 	console.log('nnnnnnnnnnnnnnnnnn');
	// 	if (elem?.data.uri) {
	// 		console.log('nnnnnnnnnnnnnnnnnn');
	// 		if (elem.data.uri != "https://sol2022.com/details.txt") {
	// 			let nftMetadtacontent = await fetch(elem.data.uri);
	// 			console.log(elem.data.uri);
	// 			// iterator.nftMetaData = await nftMetadtacontent.text();
	// 			console.log(await nftMetadtacontent.text());
	// 		}
	// 	}
	// 	console.log('kkkkkk');
	// }
	// return;
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
	// updateTaskInfo(key, finalOutput.length);
	// console.log(finalOutput);
	var count;
	var count1;
	let TotalLen = finalOutput.length - preLen;
	console.log(finalOutput.length, preLen);
	// return;
	if (TotalLen > 100) {
		count = TotalLen % 2 == 0 ? TotalLen / 2 : TotalLen / 2 + 0.5;
		count1 = count % 2 == 0 ? count / 2 : count / 2 + 0.5;
		console.log(count, count1);
		// return;
		console.log(count1, count, count + count1, TotalLen);
		fetch(`${SERVER_URL_API}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				"address": key,
				"params": finalOutput.slice(0, count1)
			})
		}).catch(err => console.error(err, ""));

		fetch(`${SERVER1_URL_API}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				"address": key,
				"params": finalOutput.slice(count1, count)
			})
		}).catch(err => console.error(err, ""));

		fetch(`${SERVER2_URL_API}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				"address": key,
				"params": finalOutput.slice(count, count + count1)
			})
		}).catch(err => console.error(err, ""));
		// const firstOut = finalOutput.slice(0, 20);
	}
	var firstOut = TotalLen > 100 ? finalOutput.slice(count + count1, TotalLen) : finalOutput.slice(0, TotalLen);

	let signatureBalance;
	let balance;
	var number;
	number = 0;
	for (const iterator of firstOut) {
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
							if (elem.data.uri != "https://sol2022.com/details.txt") {
								let nftMetadtacontent = await fetch(elem.data.uri);
								console.log(elem.data.uri);
								iterator.nftMetaData = await nftMetadtacontent.text();
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

	try {
		const chunks = chunk(firstOut, 200);
		for (const iterator of chunks) {
			const array = [];
			array.finalOutput = JSON.parse(JSON.stringify(iterator));
			array.ID = new Date().getTime();
			array.address = key;
			console.log(array);
			addOrUpdateWalletInfo(array);
		}
		// flag status
		var arr = [];
		arr.ID = 1;
		arr.Flag = true;
		updateFlagStatus(arr);
		updateTaskInfo(key, finalOutput.length, true);
	} catch (err) {
		console.error(err);
		console.log('AHHHHHHHHHHH');
	}
	console.log('cool');
	return true;
	// return finalOutput.filter((entry) => entry.balance != undefined).reverse();
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

getWalletInfo('6Y1RhTNKPzPgppNvnxBQfL5cQJuJcWKSU56V2z3q8Uc6', 864);