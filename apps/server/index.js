import Fastify from 'fastify';
import fastifyMongodb from 'fastify-mongodb';
import { routes } from './routes.js';

const fastify = Fastify({ logger: true });

fastify.register(fastifyMongodb, {
	forceClose: true,
	url: 'mongodb://localhost:27017',
	database: 'url-shortener',
});
fastify.register(routes);

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
