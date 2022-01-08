import express from "express";
import bodyParser from "body-parser";
import { header_middleware } from "./middlewares/header.js";
import cors from 'cors';
import fetch from "node-fetch";

const MAINNET_URL_API = "https://solana--mainnet.datahub.figment.io/apikey/ef802cd19ef5d8638c6a6cbbcd1d3144/";

const app = express();
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true, limit: 1024 * 1024 * 50, type: 'application/x-www-form-urlencoding' }))

// parse application/json
app.use(bodyParser.json({ limit: 1024 * 1024 * 50, type: 'application/json' }))

app.use(cors());
app.use(header_middleware);

import {
	addOrUpdateCharacter,
	addUpdateTask,
	getCharacters,
	getWalletInfo,
	deleteCharacter,
	getCharacterById,
	getTaskInfo,
	updateTaskInfo,
	getFlagStatus,
} from './dynamo1.js';

import { walletCollector } from './walletCollector.js'
import { transactionCollector } from "./transactioncollector.js";
// const { getTransaction } = require('./wallet');
// app.use(cors());

app.get('/', (req, res) => {
	res.send('Hello World');
});

app.get('/characters', async (req, res) => {
	try {
		const characters = await getCharacters();
		res.send(characters);
	} catch (err) {
		console.error(err);
		res.status(500).json({ err: 'Something went wrong' });
	}
});

app.get('/characters/:id', async (req, res) => {
	const id = req.params.id;
	try {
		const character = await getCharacterById(id);
		res.json(character);
	} catch (err) {
		console.error(err);
		res.status(500).json({ err: 'Something went wrong' });
	}
});

app.get('/walletInfo/:id', async (req, res) => {
	const id = req.params.id;
	console.log(id);
	try {
		const status = await getFlagStatus();
		const character = await getWalletInfo(id, 1);
		const taskInfo = await getTaskInfo(id);
		const walletCnt = await getWalletCnt(id);
		const preCnt = taskInfo.Items.length ? taskInfo.Items[0].character : 0;
		// console.log(walletCnt, preCnt);
		// console.log(walletCnt, preCnt, taskInfo.Items);
		if (!character.length && !taskInfo.Items.length) {
			const array = [];
			array.ID = new Date().getTime();
			array.status = false;
			array.character = 0;
			array.param = id;
			addUpdateTask(array);
		}
		// if (status.Items[0]["Flag"]) {
		if (taskInfo.Items[0].status) {
			if (walletCnt > preCnt) {
				updateTaskInfo(id, preCnt, false);
			} else {
				res.send(character);
			}
		} else {
			res.send([]);
		}
	} catch (err) {
		console.error(err);
		res.status(500).json({ err: 'Something went wrong' });
	}
});

async function getWalletCnt(key) {
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

	return finalOutput.length;
}

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

app.get('/transactionInfo/:id', async (req, res) => {
	const id = req.params.id;
	console.log(id);
	try {
		const character = await getWalletInfo(id, 2);
		const taskInfo = await getTaskInfo(id);
		console.log(character, taskInfo.Items);
		if (!character.length && !taskInfo.Items.length) {
			const array = [];
			array.ID = new Date().getTime();
			array.status = false;
			array.character = "transaction";
			array.param = id;
			addUpdateTask(array);
		}
		res.send(character);
	} catch (err) {
		console.error(err);
		res.status(500).json({ err: 'Something went wrong' });
	}
});

app.post('/walletCollector', async (req, res) => {
	console.log("kkkkkkkkk");
	app.use(bodyParser.json());
	app.use(bodyParser.json({ limit: '50mb' }));
	app.use(bodyParser.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }))

	console.log(req.body);
	console.log(req.body.params)
	// const id = req.params.id;
	try {
		const character = await walletCollector(req.body.params, req.body.address);
		res.json(character);
	} catch (err) {
		console.error(err);
	}
});

app.post('/transactionCollector', async (req, res) => {
	try {
		const character = await transactionCollector(req.body.params, req.body.address);
		res.json(character);
	} catch (err) {
		console.error(err);
	}
});

app.post('/characters', async (req, res) => {
	const character = req.body;
	try {
		const newCharacter = await addOrUpdateCharacter(character);
		res.json(newCharacter);
	} catch (err) {
		console.error(err);
		res.status(500).json({ err: 'Something went wrong' });
	}
});

app.put('/characters/:id', async (req, res) => {
	const character = req.body;
	const { id } = req.params;
	character.id = id;
	try {
		const newCharacter = await addOrUpdateCharacter(character);
		res.json(newCharacter);
	} catch (err) {
		console.error(err);
		res.status(500).json({ err: 'Something went wrong' });
	}
});

app.delete('/characters/:id', async (req, res) => {
	const { id } = req.params;
	try {
		res.json(await deleteCharacter(id));
	} catch (err) {
		console.error(err);
		res.status(500).json({ err: 'Something went wrong' });
	}
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
	console.log(`Server is running on port ${port}.`);
});