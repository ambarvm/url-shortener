// Require the framework and instantiate it
import Fastify from 'fastify';
import { fastifyDynamo } from 'fastify-dynamo';
const fastify = Fastify({ logger: true });

fastify.register(fastifyDynamo, {
	endpoint: 'http://localhost:8000',
	region: 'us-west-2',
	credentials: {
		accessKeyId: 'fakeMyKeyId',
		secretAccessKey: 'fakeSecretAccessKey',
	},
});

// Declare a route
fastify.get('/', async (request, reply) => {
	try {
		const results = await fastify.dynamo.listTables({});
		return results.TableNames;
	} catch (err) {
		console.error(err);
	}
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
