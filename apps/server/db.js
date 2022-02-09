import dotenv from 'dotenv';
import { createHash } from 'crypto';
import { create_UUID } from './utils.js';
dotenv.config();

/**
 * @param {import('mongodb').Db} db
 */
export const getDb = db => {
	return {
		async verifyApiKey(api_key) {
			try {
				const doc = await db.collection('api_keys').findOne({ api_key });
				if (doc === null) return false;
				else return true;
			} catch (err) {
				return err;
			}
		},

		/** @param {{originalUrl:string, expireAt?:string}} */
		async createShortUrl(originalUrl, api_key, expireAt, custom_url) {
			// console.log(originalUrl + api_key + process.env.SECRET_KEY);
			let shortCode;
			if (custom_url != null) {
				shortCode = custom_url;
			} else {
				shortCode = createHash('md5')
					.update(originalUrl + api_key + process.env.SECRET_KEY)
					.digest('base64')
					.slice(0, 6).replace('/','+');;
			}

			await db.collection('urls').updateOne(
				{ _id: shortCode },
				{
					$set: {
						_id: shortCode,
						originalUrl,
						shortCode,
						createdBy: api_key,
						expireAt: expireAt ? new Date(expireAt) : null,
					},
				},
				{ upsert: true },
			);
			return shortCode;
		},

		async createBioUrl(api_key, info) {
			let { name, profileUrl, instagram, twitter, linkedin, github } = info;
			// console.log(originalUrl + api_key + process.env.SECRET_KEY);
			let shortCode;
			shortCode =
				createHash('md5')
					.update(api_key + process.env.SECRET_KEY+create_UUID())
					.digest('base64')
					.slice(0, 6).replace('/','+');
			let setObj = info;
			setObj['_id'] = shortCode;
			setObj['createdBy'] = api_key;

			try{
			await db.collection('bioUrls').updateOne(
				{ _id: shortCode },
				{
					$set: setObj,
				},
				{ upsert: true },
			);
			return shortCode;
			}
			catch(err){
				console.log(err)
				return -1;
			}
		},
		/** @param {string} shortCode */
		async deleteUrl(shortCode, apiKey) {
			const res = await db
				.collection('urls')
				.deleteOne({ _id: shortCode, createdBy: apiKey });
			return res.deletedCount === 1;
		},
		/** @param {string} shortCode */
		async getOriginalUrl(shortCode) {
			/** @type {null|{originalUrl:string}} */
			const doc = await db.collection('urls').findOne({ _id: shortCode });
			return doc?.originalUrl;
		},

		/** @param {string} shortCode */
		async getBioUrl(shortCode){
			const doc = await db.collection('bioUrls').findOne({ _id: shortCode });
			return doc
		},

		/** @param {string} email */
		async getRegisteredUser(email) {
			const doc = await db.collection('users').findOne({ _id: email });
			console.log('user', doc);
			if (doc != null) {
				return doc;
			} else {
				return false;
			}
		},

		async createUser(email, password, api_key) {
			try {
				const [res] = await Promise.all([
					db.collection('users').insertOne({
						_id: email,
						email,
						password,
						api_key,
					}),
					db.collection('api_keys').insertOne({
						_id: api_key,
						api_key,
					}),
				]);

				console.log('ss', res);
				return res;
			} catch (err) {
				return err;
			}
		},

		async updateCount(Route, Source, Count, TTL) {
			console.log('updating count to', Count);
			try {
				await db
					.collection('quotas')
					.updateOne(
						{ _id: Source + '_' + Route },
						{ $set: { _id: Source + '_' + Route, Source, Route, Count, TTL } },
						{ upsert: true },
					);
			} catch (err) {
				console.log(err);
			}
			return;
		},

		async getRateLimit(key, Route) {
			const doc = await db
				.collection('quotas')
				.findOne({ _id: key + '_' + Route });
			console.log('key', key, doc);
			return doc;
		},
	};
};
