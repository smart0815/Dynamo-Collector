const express = require('express');
// const header_middleware = require("./middlewares/header");
// const app = express();
// // const cors = require('cors');
// app.use(header_middleware);
// const bodyParser = require("body-parser"); /* deprecated */
const header_middleware = require("./middlewares/header");
const cors = require('cors');

const app = express();

app.use(cors());

// parse requests of content-type - application/json
app.use(express.json());  /* bodyParser.json() is deprecated */
app.use(header_middleware);

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

const {
	addOrUpdateCharacter,
	addOrUpdateTaskInfo,
	getCharacters,
	getWalletInfo,
	deleteCharacter,
	getCharacterById,
} = require('./dynamo1');

const { walletCollector } = require('./walletCollector');
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
		const character = await getWalletInfo(id);
		console.log("mmmmmmmmmmmmmmm");
		console.log(character);
		console.log("mmmmmmmmmmmmmmm");
		if (!character.Items) {
			const array = [];
			array.ID = new Date().getTime();
			array.status = false;
			array.character = "wallet";
			array.param = id;
			addOrUpdateTaskInfo(array);
		}
		res.send(character);
	} catch (err) {
		console.error(err);
		res.status(500).json({ err: 'Something went wrong' });
	}
});

// app.get('/wallet', async (req, res) => {
// 	console.log(req.params.key);
// 	// const id = req.params.id;
// 	try {
// 		const character = await getTransaction(req.params.key);
// 		res.json(character);
// 	} catch (err) {
// 		console.error(err);
// 	}
// });

app.post('/walletCollector', async (req, res) => {
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