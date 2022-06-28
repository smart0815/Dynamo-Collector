import fetch from "node-fetch";
import * as dotenv from 'dotenv';

dotenv.config();

var moralis_api_key;
var ether_scan_api_key;

/*
	** Gets NFT transactions in descending order based on block number
*/
const getNftTransaction = async (accountKey, cursor) => {
	var getNftInfo = await fetch(`https://deep-index.moralis.io/api/v2/${accountKey}/nft/transfers?chain=eth&format=decimal&direction=both&cursor=${cursor}`, {
		"method": "GET",
		"headers": {
			"accept": "application/json",
			"X-API-Key": moralis_api_key
		}
	});

	return getNftInfo.json();
}

/*
	** Gets Internal transactions in descending order based on block number
*/
const getAccountInternalTxs = async (accountKey, offset) => {
	var getNftInfo = await fetch(`https://api.etherscan.io/api?module=account&action=txlistinternal&address=${accountKey}&apikey=HMU8UGIJQXPKT2BGNCG82IX7RMHUQNXAZC&offset=${offset}`, {
		"method": "GET",
		"headers": {
			"accept": "application/json",
		}
	});

	return getNftInfo.json();
}

/*
	** Gets native transactions in descending order based on block number
*/
const getAccountTxs = async (accountKey, startBlock) => {
	var getNftInfo = await fetch(`https://api.etherscan.io/api?module=account&action=txlist&address=${accountKey}&startblock=${startBlock}&endblock=99999999&page=1&offset=10000&sort=asc&apikey=${ether_scan_api_key}`, {
		"method": "GET",
		"headers": {
			"accept": "application/json",
		}
	});

	return getNftInfo.json();
}

export async function getEthCorrelation(accountKey, etherApiKey, moralisApiKey) {
	let NormalTxOutput = [];
	let NftResponse;
	var StartBlockNum;
	moralis_api_key = etherApiKey;
	ether_scan_api_key = moralisApiKey;
	
	while (true) {
		NftResponse = await getAccountTxs(accountKey, StartBlockNum);
		for (let i = 0; i < 5; i++) {
			try {
				if (NftResponse.status === 429) {
					await delay(11000); // Before re-trying the next loop cycle, let's wait 5 seconds (5000ms)
					continue;
				} else {
					break;
				}
			} catch {
				await delay(11000);
				continue;
			}
		}

		if (!NftResponse) {
			console.log("getCamps failed and appending to NFTHx has been skipped");
			return;
		}

		var result = NftResponse?.result;
		if (result?.length > 0) {
			NormalTxOutput = [...NormalTxOutput, ...result];
			var number = result.slice(-1)[0].blockNumber;

			StartBlockNum = parseInt(number) + 1;
		} else {
			break;
		}
	}

	let InternalTxOutput = [];
	let InternalNftResponse;

	for (let i = 0; i < 5; i++) {
		try {
			InternalNftResponse = await getAccountInternalTxs(accountKey, 0);

			if (InternalNftResponse.status === 429) {
				await delay(11000); // Before re-trying the next loop cycle, let's wait 5 seconds (5000ms)
				continue;
			} else {
				break;
			}
		} catch {
			await delay(11000);
			continue;
		}
	}

	InternalTxOutput = InternalNftResponse.result;

	let NftTxResponse;
	let NFTHx = [];
	var NFTcursor = "";

	while (true) {
		NftTxResponse = await getNftTransaction(accountKey, NFTcursor);
		for (let i = 0; i < 5; i++) {
			try {
				if (NftTxResponse.status === 429) {
					await delay(11000); // Before re-trying the next loop cycle, let's wait 5 seconds (5000ms)
					continue;
				} else {
					break;
				}
			} catch {
				await delay(11000);
				continue;
			}
		}

		if (!NftTxResponse) {
			console.log("getCamps failed and appending to NFTHx has been skipped");
			return;
		}
		NFTcursor = NftTxResponse?.cursor;
		let result = NftTxResponse?.result;
		if (result?.length > 0) {
			NFTHx = [...NFTHx, ...result];
		} else {
			break;
		}
	}

	for (const iterator of NFTHx) {
		iterator.blockTime = (new Date(iterator.block_timestamp)).getTime();

		var filterOutput = [];
		filterOutput = NormalTxOutput.filter((e) => e.hash == iterator.transaction_hash);
		var transaction_filter = NFTHx.filter((e) => e.transaction_hash == iterator.transaction_hash);

		iterator.multipleCnt = transaction_filter.length;

		if (iterator.to_address.toLowerCase() == accountKey.toLowerCase()) {
			iterator.value = filterOutput.length ? parseInt(filterOutput[0].value) + parseInt(filterOutput[0].gasPrice) * parseInt(filterOutput[0].gasUsed) : 0;
			iterator.status = filterOutput.length ? parseInt(filterOutput[0].value) ? 'buy' : 'transfer' : 'transfer';
		} else if (iterator.from_address.toLowerCase() == accountKey.toLowerCase()) {
			var internal_log = InternalTxOutput.filter((e) => e.hash == iterator.transaction_hash);
			iterator.value = internal_log.length ? internal_log[0].value : 0;
			iterator.status = internal_log.length ? 'sell' : 'transfer'
		}

		if(filterOutput.length) {
			try {
				if ((filterOutput[0].input).includes('0x4a2728ab') || (filterOutput[0].input).includes('0xa0712d68') || (filterOutput[0].input).includes('0xe467f7e0') || (filterOutput[0].input).includes('0x6b3e31eb') || (filterOutput[0].input).includes('0xa2f4dc15') || (filterOutput[0].input).includes('0xbe6da4b1') || (filterOutput[0].input).includes('0x35fbd799') || (filterOutput[0].input).includes('0xe7d3fe6b') || (filterOutput[0].input).includes('0x424a991d')) {
					iterator.status = 'mint';
				}
			} catch (error) {
			}
		}

		if (iterator.from_address != accountKey) {
			iterator.correlaccount = iterator.from_address;
		} else if (iterator.to_address != accountKey) {
			iterator.correlaccount = iterator.to_address;
		}
	}
	
	return NFTHx;
}

function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}