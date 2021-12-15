const AWS = require('aws-sdk');
require('dotenv').config();
AWS.config.update({
	region: 'us-east-2',
	accessKeyId: 'AKIAYIGNUXI7JYJLYFP3',
	secretAccessKey: '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',
});

const dynamoClient = new AWS.DynamoDB.DocumentClient();
// const TABLE_NAME = 'hpCharacters';
const TABLE_NAME = 'tokenAccount';
const WALLET_TABLE = 'Wallet_status';

const getCharacters = async () => {
	const params = {
		TableName: TABLE_NAME,
	};
	// const characters = await dynamoClient.scan(params).promise();

	const scanResults = [];
	let items;
	do {
		items = await documentClient.scan(params).promise();
		items.Items.forEach((item) => scanResults.push(item));
		params.ExclusiveStartKey = items.LastEvaluatedKey;
	} while (typeof items.LastEvaluatedKey !== "undefined");

	return scanResults;

	// return characters;
};

const getCharacterById = async (id) => {
	const params = {
		TableName: TABLE_NAME,
		Key: {
			id,
		},
	};
	return await dynamoClient.get(params).promise();
};

const addOrUpdateCharacter = async (character) => {
	const params = {
		TableName: TABLE_NAME,
		Item: character,
	};
	// console.log(character);
	return await dynamoClient.put(params).promise();
};

const addOrUpdateWalletInfo = async (character) => {
	const params = {
		TableName: WALLET_TABLE,
		Item: character,
	};
	// console.log(character);
	return await dynamoClient.put(params).promise();
};

const deleteCharacter = async (id) => {
	const params = {
		TableName: TABLE_NAME,
		Key: {
			id,
		},
	};
	return await dynamoClient.delete(params).promise();
};

const getWalletInfo = async (address) => {
	var params = {
		TableName: WALLET_TABLE,
		KeyConditionExpression: "#cat = :findValue",
		FilterExpression: '#cat = :findValue',
		ExpressionAttributeNames: {
			'#cat': 'address',
		},
		ExpressionAttributeValues: {
			':findValue': address,
		},
	};

	// dynamoClient.scan(params, function (err, data) {
	// 	console.log(data)
	// });

	return await dynamoClient.scan(params).promise();
};

module.exports = {
	dynamoClient,
	getCharacters,
	getCharacterById,
	getWalletInfo,
	addOrUpdateCharacter,
	addOrUpdateWalletInfo,
	deleteCharacter,
};
