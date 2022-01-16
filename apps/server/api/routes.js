import bcrypt from 'bcrypt';

/** @type {import('fastify').FastifyPluginCallback} */

const apiRoutes = async fastify => {
	fastify.route({
		method: 'POST',
		url: '/create',
		schema: {
			body: {
				type: 'object',
				required: ['originalUrl', 'api_key'],
				properties: {
					originalUrl: { type: 'string' },
					api_key: { type: 'string' },
				},
			},
		},
		handler: async (request,reply) => {
			let { originalUrl, api_key } = request.body;

			if (await fastify.db.verifyApiKey(api_key)) {
				let shortUrl = await fastify.db.createShortUrl(originalUrl, api_key);
				return { shortUrl: `${request.hostname}/${shortUrl}` };
			} else {
				reply.status(403);
				return 'Invalid Api key';
			}
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
		},
		handler: async (req, reply) => {
			try {
				const { email, password } = req.body;

				const User = await fastify.db.getRegisteredUser(email);

				if (User === false) {
					reply.status(409);
					return 'User not registered';
				}

				console.log(User)
				if (await bcrypt.compare(password, User.password)) {
					return User.api_key;
				} else {
					reply.status(403);
					return 'Wrong password';
				}
			} catch (err) {
				reply.status(500);
				return err;
			}
		},
	});
};

const create_UUID = () => {
	var dt = new Date().getTime();
	var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
		/[xy]/g,
		function (c) {
			var r = (dt + Math.random() * 16) % 16 | 0;
			dt = Math.floor(dt / 16);
			return (c == 'x' ? r : (r & 0x3) | 0x8).toString(16);
		},
	);
	return uuid;
};

export default apiRoutes;
