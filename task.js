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

const getTaskInfo = async (address) => {
	console.log("here");
};

getTaskInfo(false);