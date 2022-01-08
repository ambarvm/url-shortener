import { FastifyPluginCallback } from 'fastify';
import { DynamoDB, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';

declare module 'fastify' {
	interface FastifyInstance {
		dynamo: DynamoDB;
	}
}

export const fastifyDynamo: FastifyPluginCallback<DynamoDBClientConfig>;
export default fastifyDynamo;
