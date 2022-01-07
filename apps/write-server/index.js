// Require the framework and instantiate it
import Fastify from 'fastify';
const fastify = Fastify({ logger: true });

// Declare a route
fastify.get('/', async (request, reply) => {
	return `Hello write-server`;
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
