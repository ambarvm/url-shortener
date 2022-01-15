import { createHash } from 'crypto';

/**
 * @param {import('fastify-mongodb').FastifyMongoObject['db']} db
 * @param {string} originalUrl
 */
export async function createShortUrl(db, originalUrl) {
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
}

/**
 * @param {import('fastify-mongodb').FastifyMongoObject['db']} db
 * @param {string} shortCode
 */
export async function getOriginalUrl(db, shortCode) {
	/** @type {null|{originalUrl:string}} */
	const doc = await db.collection('urls').findOne({ shortCode });
	return doc?.originalUrl;
}
