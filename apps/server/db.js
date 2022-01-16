import bcrypt from 'bcrypt'
import dotenv from 'dotenv';
import {createHash} from 'crypto'
dotenv.config()
/**
 * @param {import('fastify').FastifyInstance} fastify
 */
export const getDb = db => {
	return {
		async verifyApiKey(api_key) {
			try{
			const doc = await db.collection('api_keys').findOne({ api_key });
			if (doc === null) return false;
			else return true;
			}
			catch(err){
				return err;
			}
		},


		async createShortUrl(originalUrl, api_key) {
			
			console.log(originalUrl+api_key+process.env.SECRET_KEY)
			const shortCode = createHash('md5')
			.update(originalUrl+api_key+process.env.SECRET_KEY)
			.digest('hex')
			.slice(0, 6);

			await db
				.collection('urls')
				.updateOne(
					{ _id: shortCode },
					{ $set: { _id: shortCode, originalUrl, shortCode , createdBy : api_key } },
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

		/** @param {string} email */
		async getRegisteredUser(email) {
			const doc = await db.collection('users').findOne({ email });
			console.log('user', doc);
			if (doc != null) {
				return doc;
			} else {
				return false;
			}
		},

		async createUser(email, password, api_key) {
			try {
				const res = await db.collection('users').insert({
					_id: email,
					email,
					password,
					api_key,
				});

				await db.collection('api_keys').insert({
					_id: api_key,
					api_key: api_key,
				});

				console.log('ss', res);
				return res;
			} catch (err) {
				return err;
			}
		},
	};
};
