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
					originalUrl: { $ref: 'uri' },
					expireAt: { type: 'string', format: 'date-time' },
				},
			},
			response: {
				200: {
					type: 'object',
					properties: {
						shortUrl: { $ref: 'uri' },
					},
				},
			},
		},
		handler: async request => {
			let { originalUrl, expireAt } = request.body;
			let shortUrl = await fastify.db.createShortUrl({ originalUrl, expireAt });
			return { shortUrl: `${request.hostname}/${shortUrl}` };
		},
	});
};

export default apiRoutes;
