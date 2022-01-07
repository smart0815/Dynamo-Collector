import AWS from 'aws-sdk';

AWS.config.update({
	region: 'us-east-2',
	accessKeyId: 'AKIAYIGNUXI7JYJLYFP3',
	secretAccessKey: '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',
	paramValidation: false
});

const dynamoClient = new AWS.DynamoDB.DocumentClient();
const TASK_TABLE = 'task_status';
const FLAG_TABLE = 'Flag'

import {
	getWalletInfo,
} from './wallet.js';

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
	if (taskInfo && status.Items[0]["Flag"]) {
		// if (taskInfo.Items[0].character == 'wallet') {
		// console.log(taskInfo.Items[0].param, taskInfo.Items[0].character);
		var arr = [];
		arr.ID = 1;
		arr.Flag = false;
		updateFlagStatus(arr);
		getWalletInfo(taskInfo.Items[0].param, taskInfo.Items[0].character);
		console.log("really?");
		// }
	}
};

getTaskInfo(false);