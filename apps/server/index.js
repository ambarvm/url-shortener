import Fastify from 'fastify';
import fastifyMongodb from 'fastify-mongodb';
import fastifySwagger from 'fastify-swagger';
import pointOfView from 'point-of-view';
import fastifyFormbody from 'fastify-formbody';
import fastifyCookie from 'fastify-cookie';
import fastifyRateLimit from 'fastify-rate-limit';
import fastifyStatic from 'fastify-static';
import Handlebars from 'handlebars';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import connect from './mongoClient.js';
import { addSchemas } from './schema.js';
import { getDb } from './db.js';
import { routes } from './routes.js';
import { getIncrFunction, RateLimiterStore } from './rateLimiterStore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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
fastify.register(fastifyFormbody);
fastify.register(fastifyStatic, {
	root: path.join(__dirname, 'static'),
	prefix: '/static/',
	maxAge: '1d',
});
fastify.register(fastifyCookie, {
	secret: process.env.COOKIE_SECRET,
	prefix: '__Host-',
});

fastify.register(fastifySwagger, {
	routePrefix: '/docs',
	exposeRoute: true,
	swagger: {
		info: {
			title: 'URL Shortener',
		},
		host: process.env.HOST_URL,
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

fastify.register(pointOfView, {
	engine: {
		handlebars: Handlebars,
	},
	root: './views',
	layout: 'layouts/main.hbs',
});

fastify.setErrorHandler(async (error, request, reply) => {
	return reply.view('error', { error });
});
fastify.setNotFoundHandler(async (request, reply) => {
	const error = new Error('Page Not Found');
	error.statusCode = 404;
	return reply.view('error', { error });
});

fastify.ready(err => {
	if (err) throw err;
	fastify.swagger();
});

// Run the server!
const start = async () => {
	try {
		await fastify.listen(process.env.PORT || 3000, '0.0.0.0');
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
};
start();
