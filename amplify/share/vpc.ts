import type * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";

const vpcResource = (stack: cdk.Stack) => {
	const vpc = new ec2.Vpc(stack, "Vpc", {
		vpcName: "Vpc",
		maxAzs: 2,
		subnetConfiguration: [
			{
				name: "Isolated",
				subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
				cidrMask: 24,
			},
			{
				name: "Private",
				subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
				cidrMask: 24,
			},
			{
				name: "Public",
				subnetType: ec2.SubnetType.PUBLIC,
				cidrMask: 24,
			},
		],
	});

	const sgBastion = new ec2.SecurityGroup(stack, "SgBastion", {
		vpc,
		securityGroupName: "SgBastion",
		description: "Security group for bastion host",
	});

	const sgRdsProxy = new ec2.SecurityGroup(stack, "SgRdsProxy", {
		vpc,
		securityGroupName: "SgRdsProxy",
		description: "Security group for RDS Proxy",
	});

	const sgRds = new ec2.SecurityGroup(stack, "SgRds", {
		vpc,
		securityGroupName: "SgRds",
		description: "Security group for RDS",
	});
	sgRds.addIngressRule(sgRdsProxy, ec2.Port.tcp(3306), "RDS Proxy to RDS");
	sgRds.addIngressRule(sgBastion, ec2.Port.tcp(3306), "Bastion to RDS");
	return {
		vpc,
		sgBastion,
		sgRdsProxy,
		sgRds,
	};
};

export default vpcResource;
