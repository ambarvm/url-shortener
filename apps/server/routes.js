import apiRoutes from './api/routes.js';

/** @type {import('fastify').FastifyPluginCallback} */
export const routes = async fastify => {
	fastify.register(apiRoutes, { prefix: '/api' });

	fastify.get('/', async (request, reply) => {
		const [expiryDate, time] = new Date().toISOString().split('T');
		return reply.view('index', {
			isLoggedIn: !!request.cookies['api_key'],
			originalUrl: '',
			expiryDate,
			expiryTime: time.slice(0, 5),
		});
	});
	fastify.post('/', async (request, reply) => {
		try {
			if (!request.cookies['api_key']) {
				return reply.redirect('/login');
			}
			const { originalUrl, custom_url, expire, expiryDate, expiryTime } =
				request.body;
			const res = await fastify.inject({
				method: 'POST',
				url: '/api/create',
				payload: {
					originalUrl,
					...(custom_url && { custom_url }),
					...(expire && {
						expireAt: `${expiryDate}T${expiryTime}:00Z`,
					}),
				},
				headers: {
					authorization: fastify.unsignCookie(request.cookies.api_key).value,
				},
			});
			if (res.statusCode >= 400) {
				const error = new Error(res.body);
				error.statusCode = res.statusCode;
				throw new Error(JSON.parse(res.body).message);
			}
			const { shortUrl } = JSON.parse(res.body);
			const urlObj = new URL(shortUrl);
			urlObj.host = request.hostname;
			return reply.view('index', {
				originalUrl,
				shortUrl: urlObj.toString(),
				isLoggedIn: !!request.cookies['api_key'],
			});
		} catch (error) {
			if (error) {
				return reply.view('index', {
					error,
					isLoggedIn: !!request.cookies['api_key'],
				});
			}
		}
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
		url: '/bio/:shortCode',
		schema: {
			response: {
				200: {
					description: 'Object containing user links and information',
					type: 'object',
					properties: {
						name: { type: 'string' },
						instagram: { type: 'string' },
						twitter: { type: 'string' },
						linkedin: { type: 'string' },
						github: { type: 'string' },
					},
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
				const bio = await fastify.db.getBioUrl(shortCode);
				console.log(bio);
				if (!bio) {
					reply.callNotFound();
					return;
				}
				return reply.view('bio', {
					name: bio.name,
					links: [
						{ name: 'Instagram', url: bio.instagram },
						{ name: 'Twitter', url: bio.twitter },
						{ name: 'LinkedIn', url: bio.linkedin },
						{ name: 'GitHub', url: bio.github },
					],
				});
			} catch (err) {
				fastify.log.error(err);
				return;
			}
		},
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

	// create bio page
	fastify.get('/new/bio', async (request, reply) => {
		if (!request.cookies['api_key']) {
			return reply.redirect('/login');
		}
		return reply.view('new-bio', { isLoggedIn: true });
	});

	fastify.post('/new/bio', async (request, reply) => {
		try {
			if (!request.cookies['api_key']) {
				return reply.redirect('/login');
			}
			const res = await fastify.inject({
				method: 'POST',
				url: {
					protocol: request.protocol,
					pathname: '/api/createBioLink',
					hostname: request.hostname,
					port: new URL(`${request.protocol}://${request.hostname}`).port || 80,
				},
				payload: request.body,
				headers: {
					authorization: fastify.unsignCookie(request.cookies.api_key).value,
				},
			});
			if (res.statusCode >= 400) {
				const error = new Error(res.body);
				error.statusCode = res.statusCode;
				throw new Error(res.body);
			}
			const { shortUrl } = JSON.parse(res.body);
			const urlObj = new URL(shortUrl);
			urlObj.host = request.hostname;
			return reply.redirect(303, urlObj.toString());
		} catch (error) {
			if (error) {
				return reply.view('new-bio', { error });
			}
		}
	});
};
