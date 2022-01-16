import apiRoutes from './api/routes.js';
import fastifyRateLimit from 'fastify-rate-limit';



/** @type {import('fastify').FastifyPluginCallback} */
export const routes = async fastify => {
	fastify.register(apiRoutes, { prefix: '/api' });

	

	fastify.route({
		method: 'GET',
		url: '/:shortCode',
		schema: {
			response: {
				303: {
					description: 'Redirect to the original URL',
					headers: {
						Location: { type: 'string' },
					},
					type: 'null',
				},
				404: {
					description: 'Short URL not found',
					type: 'null',
				},
			},
		},
		handler: async (request, reply) => {
			try {
				const { shortCode } = request.params;
				const originalUrl = await fastify.db.getOriginalUrl(shortCode);
				if (!originalUrl) {
					reply.callNotFound();
					return;
				}
				reply.redirect(303, originalUrl);
			} catch (err) {
				fastify.log.error(err);
			}
		},
	});
};
