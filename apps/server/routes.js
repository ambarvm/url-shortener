import apiRoutes from './api/routes.js';
import { getOriginalUrl } from './urls.js';

/** @type {import('fastify').FastifyPluginCallback} */
export const routes = async fastify => {
	fastify.register(apiRoutes, { prefix: '/api' });

	fastify.get('/:shortCode', async (request, reply) => {
		try {
			const { shortCode } = request.params;
			const originalUrl = await getOriginalUrl(fastify.mongo.db, shortCode);
			if (!originalUrl) {
				reply.callNotFound();
				return;
			}
			reply.redirect(301, originalUrl);
		} catch (err) {
			fastify.log.error(err);
		}
	});
};
