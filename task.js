const AWS = require('aws-sdk');
const { param } = require('express/lib/request');
require('dotenv').config();
AWS.config.update({
	region: 'us-east-2',
	accessKeyId: 'AKIAYIGNUXI7JYJLYFP3',
	secretAccessKey: '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',
	paramValidation: false
});

const dynamoClient = new AWS.DynamoDB.DocumentClient();
const TASK_TABLE = 'task_status';
const FLAG_TABLE = 'Flag'
const {
	getTransaction,
} = require('./wallet');

const getFlagStatus = async () => {
	const params = {
		TableName: FLAG_TABLE
	};
	return await dynamoClient.scan(params).promise();
};

const updateFlagStatus = async (character) => {
	const params = {
		TableName: FLAG_TABLE,
		Item: character,
	};
	return await dynamoClient.put(params).promise();
};

const getTaskInfo = async (address) => {
	const status = await getFlagStatus();
	console.log(status);

	var params = {
		TableName: TASK_TABLE,
		KeyConditionExpression: "#cat = :findValue",
		FilterExpression: '#cat = :findValue',
		ExpressionAttributeNames: {
			'#cat': 'status',
		},
		ExpressionAttributeValues: {
			':findValue': address,
		},
	};

	var taskInfo = await dynamoClient.scan(params).promise();
	console.log(taskInfo);
	
};

getTaskInfo(false);
// getFlagStatus(1);
// addOrUpdateCharacter(hp);