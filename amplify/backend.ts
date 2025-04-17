import { defineBackend } from "@aws-amplify/backend";
import * as cdk from "aws-cdk-lib";
import * as agw from "aws-cdk-lib/aws-apigatewayv2";
import * as agwAuth from "aws-cdk-lib/aws-apigatewayv2-authorizers";
import * as agwItg from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as lmd from "aws-cdk-lib/aws-lambda";
import { auth } from "./auth/resource";

const backend = defineBackend({ auth });

const userPool = backend.auth.resources.userPool;
const userPoolClient = backend.auth.resources.userPoolClient;
const userPoolAuth = new agwAuth.HttpUserPoolAuthorizer("ApiAuth", userPool, {
	authorizerName: "ApiAuth",
	userPoolClients: [userPoolClient],
});

const apiStack = backend.createStack("ApiStack");

const apiLmd = new lmd.DockerImageFunction(apiStack, "ApiLmd", {
	functionName: "ApiLmd",
	architecture: lmd.Architecture.ARM_64,
	code: lmd.DockerImageCode.fromImageAsset("./backend", {}),
});
const apiLmdItg = new agwItg.HttpLambdaIntegration("ApiLmdItg", apiLmd);
const httpApi = new agw.HttpApi(apiStack, "HttpApi", {
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

httpApi.addRoutes({
	path: "/{proxy+}",
	methods: [agw.HttpMethod.GET, agw.HttpMethod.POST, agw.HttpMethod.PUT, agw.HttpMethod.PATCH, agw.HttpMethod.DELETE],
	integration: apiLmdItg,
	authorizer: userPoolAuth,
});

backend.addOutput({
	custom: {
		API: {
			[httpApi.httpApiName!]: {
				endpoint: httpApi.url,
				region: cdk.Stack.of(httpApi).region,
				apiName: httpApi.httpApiName,
			},
		},
	},
});