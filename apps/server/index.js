// Require the framework and instantiate it
import Fastify from 'fastify';
import { fastifyDynamo } from 'fastify-dynamo';
import { createHash } from 'crypto';
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
fastify.get('/:url', async (request, reply) => {
	try {
		getUrl(request.params.url, function (err, data) {
			if (err) reply.status(500).send(err);
			else {
				if (data.Item) reply.send(data.Item.originalUrl.S);
				else reply.send('Does not exist');
			}
		});
	} catch (err) {
		console.error(err);
	}
});

fastify.route({
	method: 'POST',
	url: '/api/create',
	schema: {
		body: {
			type: 'object',
			required: ['originalUrl'],
			properties: {
				originalUrl: { type: 'string' },
			},
		},
	},
	handler: async (request, reply) => {
		let originalUrl = request.body.originalUrl;

		// console.log(request)

		/** Shortening using MD5 , will improve this in future */
		let shortenedUrl = createHash('md5')
			.update(originalUrl)
			.digest('hex')
			.slice(0, 6);

		addUrl(originalUrl, shortenedUrl, function (err, data) {
			if (err) {
				reply.send(err);
			} else {
				console.log(data);
				reply.send(shortenedUrl);
			}
		});
	},
});

const addUrl = async (originalUrl, shortenedUrl, callback) => {
	const params = {
		Item: {
			originalUrl: {
				S: originalUrl,
			},
			shortenedUrl: {
				S: shortenedUrl,
			},
		},
		ReturnConsumedCapacity: 'TOTAL',
		TableName: 'urls',
	};

	fastify.dynamo.putItem(params, function (err, data) {
		callback(err, data);
	});
};

const getUrl = async (originalUrl, callback) => {
	console.log('oo', originalUrl);
	const params = {
		Key: {
			shortenedUrl: {
				S: originalUrl,
			},
		},
		TableName: 'urls',
	};

	fastify.dynamo.getItem(params, function (err, data) {
		callback(err, data);
	});
};

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
