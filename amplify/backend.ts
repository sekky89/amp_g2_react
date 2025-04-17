import { defineBackend } from "@aws-amplify/backend";
import * as cdk from "aws-cdk-lib";
import * as agw from "aws-cdk-lib/aws-apigatewayv2";
import * as agwAuth from "aws-cdk-lib/aws-apigatewayv2-authorizers";
import * as agwItg from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as lmd from "aws-cdk-lib/aws-lambda";
import * as lmdNode from "aws-cdk-lib/aws-lambda-nodejs";
import { auth } from "./auth/resource";
import rdsResource from "./rds/rds";
import vpcResource from "./share/vpc";

const backend = defineBackend({ auth });

const stack = backend.createStack("ApiStack");

const { vpc, sgBastion, sgRdsProxy, sgRds } = vpcResource(stack);
const { proxy, secretsRds } = rdsResource(stack, { vpc, sgRds });
// const ec2Bastion = new ec2.BastionHostLinux(stack, "Bastion", {
// 	vpc,
// 	instanceName: "Bastion",
// 	instanceType: ec2.InstanceType.of(
// 		ec2.InstanceClass.T3,
// 		ec2.InstanceSize.MICRO,
// 	),
// 	securityGroup: sgBastion,
// 	subnetSelection: { subnetType: ec2.SubnetType.PUBLIC },
// });
// ec2Bastion.instance.addUserData("yum update -y", "yum install -y mysql jq");

const userPool = backend.auth.resources.userPool;
const userPoolClient = backend.auth.resources.userPoolClient;
const userPoolAuth = new agwAuth.HttpUserPoolAuthorizer("ApiAuth", userPool, {
	authorizerName: "ApiAuth",
	userPoolClients: [userPoolClient],
});

const lambdaProps: lmdNode.NodejsFunctionProps = {
	runtime: lmd.Runtime.NODEJS_22_X,
	architecture: lmd.Architecture.ARM_64,
	memorySize: 128,
	timeout: cdk.Duration.seconds(10),
	bundling: {
		workingDirectory: "backend/lambda1",
		externalModules: [],
		nodeModules: [],
		commandHooks: {
			beforeInstall(inputDir: string, outputDir: string): string[] {
				return [``];
			},
			beforeBundling(inputDir: string, outputDir: string): string[] {
				return [`cd ${inputDir} && yarn`];
			},
			afterBundling(inputDir: string, outputDir: string): string[] {
				return [
					`cp ${inputDir}/node_modules/.prisma/client/libquery_engine-linux-arm64-openssl-1.0.x.so.node ${outputDir}`,
					`cp ${inputDir}/prisma/schema.prisma ${outputDir}`,
				];
			},
		},
	},
	environment: {
		DB_HOST: proxy.endpoint,
		DB_PORT: "3306",
		DB_USER: "dbadmin",
		DB_NAME: "mydb",
	},
	vpc,
	vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
	securityGroups: [sgRdsProxy],
};

const lmdApi = new lmdNode.NodejsFunction(stack, "ApiLmd", {
	functionName: "ApiLmd",
	entry: "backend/lambda1/api.ts",
	handler: "handler",
	...lambdaProps,
});
secretsRds.grantRead(lmdApi);

const agwApi = new agw.HttpApi(stack, "HttpApi", {
	apiName: "Agw",
	corsPreflight: {
		allowMethods: [
			agw.CorsHttpMethod.GET,
			agw.CorsHttpMethod.POST,
			agw.CorsHttpMethod.PUT,
			agw.CorsHttpMethod.PATCH,
			agw.CorsHttpMethod.DELETE,
			agw.CorsHttpMethod.OPTIONS,
		],
		allowOrigins: ["*"],
		allowHeaders: ["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key"],
	},
	createDefaultStage: true,
});

const itgApi = new agwItg.HttpLambdaIntegration("ApiLmdItg", lmdApi);
agwApi.addRoutes({
	path: "/{proxy+}",
	methods: [
		agw.HttpMethod.GET,
		agw.HttpMethod.POST,
		agw.HttpMethod.PUT,
		agw.HttpMethod.PATCH,
		agw.HttpMethod.DELETE,
	],
	integration: itgApi,
	authorizer: userPoolAuth,
});

backend.addOutput({
	custom: {
		API: {
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			[agwApi.httpApiName!]: {
				endpoint: agwApi.url,
				region: cdk.Stack.of(agwApi).region,
				apiName: agwApi.httpApiName,
			},
		},
	},
});
