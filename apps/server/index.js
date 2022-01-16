import Fastify from 'fastify';
import fastifyMongodb from 'fastify-mongodb';
import fastifySwagger from 'fastify-swagger';
import dotenv from 'dotenv';

import { getDb } from './db.js';
import { routes } from './routes.js';

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
