import Fastify from 'fastify';
import fastifyMongodb from 'fastify-mongodb';
import fastifySwagger from 'fastify-swagger';
import dotenv from 'dotenv';

import { getDb } from './db.js';
import { routes } from './routes.js';
import RateLimiterStore from './rateLimiterStore.js';
import fastifyRateLimit from 'fastify-rate-limit';
// fastifyRateLimits

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
	url: process.env.MONGO_URL,
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

fastify.register(async instance => {
	fastify.decorate('db', getDb(instance.mongo.db));
	fastify.register(routes);
});



fastify.register(fastifyRateLimit, {
	// global: false, // default true
	max:1,
	timeWindow: 1000 * 60 * 60,
	// allowList: ['127.0.0.1'],
	// redis: new Redis({ host: '127.0.0.1' }),
	store: RateLimiterStore,
	skipOnError: true, // default false
	keyGenerator: function (req) {
		console.log("Key",req.body['api_key'])
		return req.body['api_key'];
	},
	// errorResponseBuilder: function(req, context) { /* ... */},
	// addHeadersOnExceeding: { // default show all the response headers when rate limit is not reached
	//   'x-ratelimit-limit': true,
	//   'x-ratelimit-remaining': true,
	//   'x-ratelimit-reset': true
	// },
	// addHeaders: { // default show all the response headers when rate limit is reached
	//   'x-ratelimit-limit': true,
	//   'x-ratelimit-remaining': true,
	//   'x-ratelimit-reset': true,
	//   'retry-after': true
	// }
});

fastify.ready(err => {
	if (err) throw err;
	fastify.swagger();
});

// Run the server!
const start = async () => {
	try {
		await fastify.listen(3000);
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
};
start();
