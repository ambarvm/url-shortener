import fp from 'fastify-plugin';
import { DynamoDB } from '@aws-sdk/client-dynamodb';

function db(fastify, options = {}, next) {
	const client = new DynamoDB({endpoint:'http://localhost:8000'});
	if (!fastify.dynamo) {
		fastify.decorate('dynamo', client);
	}
	next();
}

export const fastifyDynamo = fp(db);
