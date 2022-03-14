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

import { walletCollector } from './walletCollector.js';
import { purchaserCollector } from './purchaserCollector.js';
import { getEthereumPurchaserCollector } from './ethereumPurchaserCollector.js';
// const { getTransaction } = require('./wallet');
// app.use(cors());

app.get('/', (req, res) => {
	res.send('Hello World');
});

app.post('/walletCollector', async (req, res) => {
	app.use(bodyParser.json());
	app.use(bodyParser.json({ limit: '50mb' }));
	app.use(bodyParser.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }))

	try {
		const character = await walletCollector(req.body);
		res.json(character);
	} catch (err) {
		console.error(err);
	}
});

app.post('/purchaserCollector', async (req, res) => {
	app.use(bodyParser.json());
	app.use(bodyParser.json({ limit: '50mb' }));
	app.use(bodyParser.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }))

	try {
		const character = await purchaserCollector(req.body);
		res.json(character);
	} catch (err) {
		console.error(err);
	}
});

app.post('/ethereumPurchaserCollector', async (req, res) => {
	app.use(bodyParser.json());
	app.use(bodyParser.json({ limit: '50mb' }));
	app.use(bodyParser.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }))

	try {
		const character = await getEthereumPurchaserCollector(req.body);
		res.json(character);
	} catch (err) {
		console.error(err);
	}
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
	console.log(`Server is running on port ${port}.`);
});