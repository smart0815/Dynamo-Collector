const fetch = require('cross-fetch');
const { addOrUpdateWalletInfo } = require('./dynamo1');

let milliseconds = 11000;
const MAINNET_URL_API = "https://solana--mainnet.datahub.figment.io/apikey/ef802cd19ef5d8638c6a6cbbcd1d3144/";

async function walletCollector(finalOutput, key) {
	console.log(key);
	console.log('here')
	let signatureBalance;
	let balance;
	var number;
	number=0;
	for (const iterator of finalOutput) {
		number++
		console.log(number);
		
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