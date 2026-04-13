import { MongoClient } from 'mongodb';
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/e-parking';
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
await client.connect();
const db = client.db();
try {
  const res = await db.collection('tarifas').deleteMany({});
  console.log(`Deleted tarifas count: ${res.deletedCount}`);
} catch (e) {
  console.log('Error deleting tarifas:', e.message);
}
await client.close();
console.log('done');
