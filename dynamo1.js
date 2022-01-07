// const AWS = require('aws-sdk');
import AWS from 'aws-sdk';
// require('dotenv').config();

AWS.config.update({
	region: 'us-east-2',
	accessKeyId: 'AKIAYIGNUXI7JYJLYFP3',
	secretAccessKey: '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',
});

const dynamoClient = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'tokenAccount';
const WALLET_TABLE = 'Wallet_status';
const TASK_TABLE = 'task_status';
const FLAG_TABLE = 'Flag';
const TRANSACTION_TABLE = 'transaction';

export const getCharacters = async () => {
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
};

export const getCharacterById = async (id) => {
	const params = {
		TableName: TABLE_NAME,
		Key: {
			id,
		},
	};
	return await dynamoClient.get(params).promise();
};

export const addOrUpdateCharacter = async (character) => {
	const params = {
		TableName: TABLE_NAME,
		Item: character,
	};
	// console.log(character);
	return await dynamoClient.put(params).promise();
};

export const addOrUpdateTransactionInfo = async (character) => {
	const params = {
		TableName: TRANSACTION_TABLE,
		Item: character,
	};
	const addTransactionInfo = await dynamoClient.put(params).promise();
	console.log(',...................');
	console.log(addTransactionInfo);
	console.log(',...................');
	return addTransactionInfo;
};

export const addOrUpdateWalletInfo = async (character) => {
	const params = {
		TableName: WALLET_TABLE,
		Item: character,
	};
	return await dynamoClient.put(params).promise();
};

export const getFlagStatus = async () => {
	const params = {
		TableName: FLAG_TABLE
	};
	return await dynamoClient.scan(params).promise();
};

export const updateFlagStatus = async (character) => {
	const params = {
		TableName: FLAG_TABLE,
		Item: character,
	};
	return await dynamoClient.put(params).promise();
};

export const getTaskInfo = async (character) => {
	var params = {
		TableName: TASK_TABLE,
		KeyConditionExpression: "#cat = :findValue",
		FilterExpression: '#cat = :findValue',
		ExpressionAttributeNames: {
			'#cat': 'param',
		},
		ExpressionAttributeValues: {
			':findValue': character,
		},
	};
	return await dynamoClient.scan(params).promise();
};

export const addUpdateTask = async (character) => {
	const params = {
		TableName: TASK_TABLE,
		Item: character,
	};
	return await dynamoClient.put(params).promise();
};

export const updateTaskInfo = async (character, len, status) => {
	var params = {
		TableName: TASK_TABLE,
		KeyConditionExpression: "#cat = :findValue",
		FilterExpression: '#cat = :findValue',
		ExpressionAttributeNames: {
			'#cat': 'param',
		},
		ExpressionAttributeValues: {
			':findValue': character,
		},
	};

	var updateParam = await dynamoClient.scan(params).promise();
	updateParam.Items[0].status = status;
	updateParam.Items[0].character = len;
	addUpdateTask(updateParam.Items[0]);
};

export const deleteCharacter = async (id) => {
	const params = {
		TableName: TABLE_NAME,
		Key: {
			id,
		},
	};
	return await dynamoClient.delete(params).promise();
};

export const getWalletInfo = async (address, info) => {
	var params = {
		TableName: info == 1 ? WALLET_TABLE : TRANSACTION_TABLE,
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
	const scanResults = [];
	let items;
	do {
		items = await dynamoClient.scan(params).promise();
		items.Items.forEach((item) => scanResults.push(item));
		params.ExclusiveStartKey = items.LastEvaluatedKey;
	} while (typeof items.LastEvaluatedKey !== "undefined");
	return scanResults;
	// console.log(scanResults)
};