import dotenv from 'dotenv';
import connect from './mongoClient.js';

dotenv.config();

const client = await connect();
const db = client.db();
await db.createIndex('urls', { expireAt: 1 }, { expireAfterSeconds: 0 });
await client.close();
