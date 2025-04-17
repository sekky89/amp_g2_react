import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as sm from "aws-cdk-lib/aws-secretsmanager";
import * as ssm from "aws-cdk-lib/aws-ssm";

const rdsResource = (
	stack: cdk.Stack,
	{ vpc, sgRds }: { vpc: ec2.Vpc; sgRds: ec2.SecurityGroup },
) => {
	const secretsRds = new sm.Secret(stack, "SecretsRds", {
		secretName: "SecretsRds",
		generateSecretString: {
			secretStringTemplate: JSON.stringify({ username: "dbadmin" }),
			excludePunctuation: true,
			includeSpace: false,
			generateStringKey: "password",
		},
	});

	new ssm.StringParameter(stack, "DBCredentialsArn", {
		parameterName: "rds-credentials-arn",
		stringValue: secretsRds.secretArn,
	});

	const rdsCluster = new rds.DatabaseCluster(stack, "RdsCluster", {
		clusterIdentifier: "RdsCluster",
		engine: rds.DatabaseClusterEngine.auroraMysql({
			version: rds.AuroraMysqlEngineVersion.VER_3_08_1,
		}),
		credentials: rds.Credentials.fromSecret(secretsRds),
		serverlessV2MinCapacity: 0,
		serverlessV2MaxCapacity: 1,
		writer: rds.ClusterInstance.serverlessV2("Writer"),
		vpc,
		vpcSubnets: {
			subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
		},
		securityGroups: [sgRds],
		removalPolicy: cdk.RemovalPolicy.DESTROY,
		deletionProtection: false,
		defaultDatabaseName: "mydb",
	});

	const proxy = rdsCluster.addProxy("RdsProxy", {
		dbProxyName: "RdsProxy",
		secrets: [secretsRds],
		vpc,
		securityGroups: [sgRds],
		debugLogging: true,
	});
	return { proxy, secretsRds };
};

export default rdsResource;
