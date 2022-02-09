import apiRoutes from './api/routes.js';

/** @type {import('fastify').FastifyPluginCallback} */
export const routes = async fastify => {
	fastify.register(apiRoutes, { prefix: '/api' });

	fastify.get('/', async (request, reply) => {
		return reply.view('index', { isLoggedIn: !!request.cookies['api_key'] });
	});
	fastify.get('/register', async (request, reply) => {
		if (request.cookies['api_key']) {
			return reply.redirect('/');
		}
		return reply.view('register');
	});
	fastify.post('/register', async (request, reply) => {
		try {
			if (request.cookies['api_key']) {
				return reply.redirect('/');
			}
			const res = await fastify.inject({
				method: 'POST',
				url: '/api/register',
				payload: request.body,
			});
			if (res.statusCode >= 400) {
				const error = new Error(res.body);
				error.statusCode = res.statusCode;
				throw new Error(res.body);
			}
			return reply.redirect('/login');
		} catch (error) {
			if (error) {
				return reply.view('register', { error });
			}
		}
	});

	fastify.get('/login', async (request, reply) => {
		if (request.cookies['api_key']) {
			return reply.redirect('/');
		}
		return reply.view('login');
	});
	fastify.post('/login', async (request, reply) => {
		try {
			if (request.cookies['api_key']) {
				return reply.redirect('/');
			}
			const res = await fastify.inject({
				method: 'POST',
				url: '/api/getapikey',
				payload: request.body,
			});
			if (res.statusCode >= 400) {
				const error = new Error(res.body);
				error.statusCode = res.statusCode;
				throw new Error(res.body);
			}
			reply.setCookie('api_key', res.body, {
				httpOnly: true,
				sameSite: 'strict',
				secure: true,
				signed: true,
				maxAge: 1000 * 60 * 60 * 24 * 7,
			});
			return reply.redirect('/');
		} catch (error) {
			if (error) {
				return reply.view('login', { error });
			}
		}
	});

	fastify.get('/logout', async (request, reply) => {
		return reply.clearCookie('api_key').redirect('/');
	});

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
