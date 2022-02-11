import { MongoClient } from 'mongodb';
import fs from 'fs'
/** @type {MongoClient} */
let client;

async function connect() {
	const rdspem= fs.readFileSync('rds.pem');
	if (!client) {
		client = await MongoClient.connect(process.env.MONGO_URL,{
			tlsCAFile: `rds.pem`
		});
	}
	return client;
}

export default connect;
