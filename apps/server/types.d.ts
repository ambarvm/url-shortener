import { getDb } from './db.js';

declare module 'fastify' {
	interface FastifyInstance {
		db: ReturnType<typeof getDb>;
	}
}
