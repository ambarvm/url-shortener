import { createHash } from 'crypto';

/**
 * @param {import('fastify').FastifyInstance} fastify
 */
export const getDb = db => {
	return {
		/** @param {string} originalUrl */
		async createShortUrl(originalUrl) {
			// Shortening using MD5, will improve this in future
			const shortCode = createHash('md5')
				.update(originalUrl)
				.digest('hex')
				.slice(0, 6);

			await db
				.collection('urls')
				.updateOne(
					{ _id: shortCode },
					{ $set: { _id: shortCode, originalUrl, shortCode } },
					{ upsert: true },
				);
			return shortCode;
		},

		/** @param {string} shortCode */
		async getOriginalUrl(shortCode) {
			/** @type {null|{originalUrl:string}} */
			const doc = await db.collection('urls').findOne({ shortCode });
			return doc?.originalUrl;
		},
	};
};
