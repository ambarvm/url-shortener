/** @type {import('fastify').FastifyPluginCallback} */
const apiRoutes = async fastify => {
	fastify.route({
		method: 'POST',
		url: '/create',
		schema: {
			description: 'Create a new short URL',
			body: {
				type: 'object',
				required: ['originalUrl'],
				properties: {
					originalUrl: { type: 'string' },
				},
			},
			response: {
				200: {
					type: 'object',
					properties: {
						shortCode: { type: 'string' },
					},
				},
			},
		},
		handler: async request => {
			let { originalUrl } = request.body;
			let shortUrl = await fastify.db.createShortUrl(originalUrl);
			return { shortUrl: `${request.hostname}/${shortUrl}` };
		},
	});
};

export default apiRoutes;
