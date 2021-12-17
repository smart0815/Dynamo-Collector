const AWS = require('aws-sdk');
const { param } = require('express/lib/request');
require('dotenv').config();
AWS.config.update({
	region: process.env.AWS_DEFAULT_REGION,
	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
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

	// var flagInfo =  await dynamoClient.scan(params).promise();
	// status = flagInfo.Items[0]["Flag"]
	// console.log(status);
	// console.log(aa.Items[0]["Flag"]);
	return await dynamoClient.scan(params).promise();
};

const updateFlagStatus = async (character) => {
	const params = {
		TableName: FLAG_TABLE,
		Item: character,
	};
	// console.log(character);
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
	if (taskInfo && status.Items[0]["Flag"]) {
		if (taskInfo.Items[0].character == 'wallet') {
			var arr = [];
			arr.ID = 1;
			arr.Flag = true;
			updateFlagStatus(arr);
			getTransaction(taskInfo.Items[0].param);
			console.log("really?");
		}
	}
};

getTaskInfo(false);
// getFlagStatus(1);
// addOrUpdateCharacter(hp);