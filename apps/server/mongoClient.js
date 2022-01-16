import { MongoClient } from 'mongodb';

/** @type {MongoClient} */
let client;

async function connect() {
	if (!client) {
		client = await MongoClient.connect(process.env.MONGO_URL);
	}
	return client;
}

export default connect;
