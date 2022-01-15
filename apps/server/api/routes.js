import { createShortUrl } from '../urls.js';

/** @type {import('fastify').FastifyPluginCallback} */
const apiRoutes = async fastify => {
	fastify.route({
		method: 'POST',
		url: '/create',
		schema: {
			body: {
				type: 'object',
				required: ['originalUrl'],
				properties: {
					originalUrl: { type: 'string' },
				},
			},
		},
		handler: async request => {
			let { originalUrl } = request.body;
			let shortUrl = await createShortUrl(fastify.mongo.db, originalUrl);
			return { shortUrl: `${request.hostname}/${shortUrl}` };
		},
	});
};

export default apiRoutes;
