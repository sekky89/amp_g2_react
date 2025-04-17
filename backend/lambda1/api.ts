import { Signer } from "@aws-sdk/rds-signer";
import { PrismaClient } from "@prisma/client";
import type { APIGatewayProxyHandlerV2 } from "aws-lambda";

const getConnectionString = async () => {
	const dbInfo = {
		hostname: process.env.DB_HOST,
		port: Number(process.env.DB_PORT),
		username: process.env.DB_USER,
		dbname: process.env.DB_NAME,
		region: process.env.AWS_REGION,
	};
	const password = await new Signer(dbInfo).getAuthToken();
	return `mysql://${dbInfo.username}:${password}@${dbInfo.hostname}:${dbInfo.port}/${dbInfo.dbname}`;
};
export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
	const connectionString = await getConnectionString();
	const prisma = new PrismaClient({
		datasources: { db: { url: connectionString } },
		log: ["query", "info", "warn", "error"],
	});
	console.log("Event: ", event);
	return {
		statusCode: 200,
		body: JSON.stringify({ message: "Hello from Lambda!" }),
	};
};
