import AWS from 'aws-sdk';

// AWS.config.update({ region: 'REGION' });
AWS.config.update({
	region: 'us-east-2',
	accessKeyId: 'AKIAYIGNUXI7NTYMEU67',
	secretAccessKey: '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',
});

// Create EC2 service object
var ec2 = new AWS.EC2({ apiVersion: '2016-11-15' });

// Variable to hold a ID of a VPC
var vpc = null;
// Retrieve the ID of a VPC
ec2.describeVpcs(function (err, data) {
	if (err) {
		console.log("Cannot retrieve a VPC", err);
	} else {
		vpc = data.Vpcs[0].VpcId;
		console.log(data);
		var paramsSecurityGroup = {
			Description: 'DESCRIPTION',
			GroupName: 'launch-wizard-5sssssssssssssssssss',
			VpcId: vpc
		};
		console.log(paramsSecurityGroup);
		// Create the instance
		ec2.createSecurityGroup(paramsSecurityGroup, function (err, data) {
			if (err) {
				console.log("Error", err);
			} else {
				var SecurityGroupId = data.GroupId;
				console.log("Success", SecurityGroupId);
				var paramsIngress = {
					GroupId: 'SECURITY_GROUP_ID',
					IpPermissions: [
						{
							IpProtocol: "tcp",
							FromPort: 80,
							ToPort: 80,
							IpRanges: [{ "CidrIp": "0.0.0.0/0" }]
						},
						{
							IpProtocol: "tcp",
							FromPort: 22,
							ToPort: 22,
							IpRanges: [{ "CidrIp": "0.0.0.0/0" }]
						}
					]
				};
				ec2.authorizeSecurityGroupIngress(paramsIngress, function (err, data) {
					if (err) {
						console.log("Error", err);
					} else {
						console.log("Ingress Successfully Set", data);
					}
				});
			}
		});
	}
});
