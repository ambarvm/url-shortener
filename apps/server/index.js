import Fastify from 'fastify';
import fastifyMongodb from 'fastify-mongodb';
import fastifySwagger from 'fastify-swagger';
import dotenv from 'dotenv';

import connect from './mongoClient.js';
import { addSchemas } from './schema.js';
import { getDb } from './db.js';
import { routes } from './routes.js';
import { getIncrFunction, RateLimiterStore } from './rateLimiterStore.js';
import fastifyRateLimit from 'fastify-rate-limit';

dotenv.config();

const fastify = Fastify({
	logger: {
		prettyPrint:
			process.env.NODE_ENV === 'development'
				? {
						translateTime: 'HH:MM:ss Z',
						ignore: 'pid,hostname',
				  }
				: false,
	},
});

fastify.register(fastifyMongodb, {
	forceClose: true,
	client: await connect(),
});

fastify.register(fastifySwagger, {
	routePrefix: '/docs',
	exposeRoute: true,
	swagger: {
		info: {
			title: 'URL Shortener',
		},
		host: 'localhost:3000',
	},
});

addSchemas(fastify);

fastify.register(async instance => {
	fastify.decorate('db', getDb(instance.mongo.client.db()));
	getIncrFunction(fastify);

	fastify.register(fastifyRateLimit, {
		global: false,
		max: 1,
		timeWindow: 1000 * 60 * 60,
		store: RateLimiterStore,
		skipOnError: true, // default false
		keyGenerator: function (req) {
			return req.headers['authorization'];
		},
	});

	fastify.register(routes);
});

fastify.ready(err => {
	if (err) throw err;
	fastify.swagger();
});

// Run the server!
const start = async () => {
	try {
		await fastify.listen(process.env.PORT || 3000);
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
};
start();
