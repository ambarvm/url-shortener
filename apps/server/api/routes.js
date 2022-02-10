import bcrypt from 'bcrypt';
import { create_UUID } from '../utils.js';

/** @type {import('fastify').FastifyPluginCallback} */

const apiRoutes = async fastify => {
	fastify.route({
		method: 'POST',
		url: '/create',
		schema: {
			description: 'Create a new short URL',
			headers: {
				type: 'object',
				required: ['authorization'],
				properties: {
					authorization: {
						description: 'api key',
						type: 'string',
					},
				},
			},
			body: {
				type: 'object',
				required: ['originalUrl'],
				properties: {
					originalUrl: { $ref: 'uri' },
					expireAt: { type: 'string', format: 'date-time' },
					custom_url: { type: 'string', pattern: '^[a-zA-Z0-9_-]+$' },
				},
			},
			response: {
				200: {
					type: 'object',
					properties: {
						shortUrl: { $ref: 'shortUrl' },
					},
				},
			},
		},
		config: {
			rateLimit: {
				max: 10,
				timeWindow: '1 minute',
			},
		},
		handler: async (request, reply) => {
			let { originalUrl, expireAt, custom_url } = request.body;
			let api_key = request.headers['authorization'];

			if (await fastify.db.verifyApiKey(api_key)) {
				let shortUrl = await fastify.db.createShortUrl(
					originalUrl,
					api_key,
					expireAt,
					custom_url,
				);
				return {
					shortUrl: `${request.protocol}://${request.hostname}/${shortUrl}`,
				};
			} else {
				reply.status(401);
				return 'Invalid Api key';
			}
		},
	});

	fastify.route({
		method: 'POST',
		url: '/delete',
		schema: {
			description: 'Delete a short URL',
			headers: {
				type: 'object',
				required: ['authorization'],
				properties: {
					authorization: {
						description: 'api key',
						type: 'string',
					},
				},
			},
			body: {
				type: 'object',
				required: ['shortCode'],
				properties: {
					shortCode: { type: 'string' },
				},
			},
			response: {
				200: {
					type: 'object',
					properties: {
						deleted: { type: 'boolean' },
					},
				},
			},
		},
		config: {
			rateLimit: {
				max: 10,
				timeWindow: '1 minute',
			},
		},
		handler: async (request, reply) => {
			let { shortCode } = request.body;
			let api_key = request.headers['authorization'];

			const deleted = await fastify.db.deleteUrl(shortCode, api_key);
			return { deleted };
		},
	});

	fastify.route({
		method: 'POST',
		url: '/register',
		schema: {
			body: {
				type: 'object',
				required: ['email', 'password'],
				properties: {
					email: { type: 'string', format: 'email' },
					password: { type: 'string', minLength: 8 },
				},
			},
			response: {
				200: {
					description:
						'An object containing user email and api_key indicating successful registration',
					type: 'object',
					properties: {
						email: { type: 'string' },
						api_key: { type: 'string' },
					},
					409: {
						description: 'User already registered',
						type: 'string',
					},
				},
			},
		},
		handler: async (req, reply) => {
			try {
				const { email, password } = req.body;

				const oldUser = await fastify.db.getRegisteredUser(email);

				if (oldUser !== false) {
					reply.status(409);
					return 'User already registered';
				}
				const encryptedUserPassword = await bcrypt.hash(password, 10);
				const api_key = create_UUID();
				const user = await fastify.db.createUser(
					email.toLowerCase(),
					encryptedUserPassword,
					api_key,
				);
				return {
					email,
					api_key,
				};
			} catch (err) {
				return err;
			}
		},
	});

	fastify.route({
		method: 'POST',
		url: '/createBioLink',
		config: {
			rateLimit: {
				max: 5,
				timeWindow: '1 month',
				message: 'You have reached your limit of 5 bio links per month',
			},
		},
		schema: {
			body: {
				type: 'object',
				required: ['name'],
				properties: {
					name: { type: 'string' },
					instagram: { type: 'string' },
					twitter: { type: 'string' },
					linkedin: { type: 'string' },
					github: { type: 'string' },
				},
			},
			response: {
				200: {
					description: 'Bio link',
					type: 'object',
					properties: {
						shortUrl: { type: 'string' },
					},
				},
			},
		},
		handler: async (req, reply) => {
			try {
				let { name, instagram, twitter, linkedin, github } = req.body;
				let api_key = req.headers['authorization'];

				if (await fastify.db.verifyApiKey(api_key)) {
					let shortUrl = await fastify.db.createBioUrl(api_key, req.body);
					if (shortUrl === -1) {
						reply.status(500);
						return;
					}
					return { shortUrl: `${req.hostname}/bio/${shortUrl}` };
				} else {
					reply.status(401);
					return 'Invalid Api key';
				}
			} catch (err) {
				return err;
			}
		},
	});

	fastify.route({
		method: 'POST',
		url: '/getapikey',
		schema: {
			body: {
				type: 'object',
				required: ['email', 'password'],
				properties: {
					email: { type: 'string', format: 'email' },
					password: { type: 'string', minLength: 8 },
				},
			},
			response: {
				200: {
					description: 'API key',
					type: 'string',
				},
				401: {
					description: 'Invalid Credentials',
					type: 'string',
				},
			},
		},
		handler: async (req, reply) => {
			try {
				const { email, password } = req.body;

				const User = await fastify.db.getRegisteredUser(email);

				if (User === false) {
					reply.status(401);
					return 'User not registered';
				}

				console.log(User);
				if (await bcrypt.compare(password, User.password)) {
					return User.api_key;
				} else {
					reply.status(401);
					return 'Wrong password';
				}
			} catch (err) {
				reply.status(500);
				return err;
			}
		},
	});
};

export default apiRoutes;
