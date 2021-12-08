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

const getCharacters = async () => {
	const params = {
		TableName: TABLE_NAME,
	};
	const characters = await dynamoClient.scan(params).promise();
	return characters;
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

const deleteCharacter = async (id) => {
	const params = {
		TableName: TABLE_NAME,
		Key: {
			id,
		},
	};
	return await dynamoClient.delete(params).promise();
};

module.exports = {
	dynamoClient,
	getCharacters,
	getCharacterById,
	addOrUpdateCharacter,
	deleteCharacter,
};
