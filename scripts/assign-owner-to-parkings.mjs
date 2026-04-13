import { MongoClient, ObjectId } from 'mongodb';
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/e-parking';
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
await client.connect();
const db = client.db();
const manager = '69dc8aeada2e84f2a038f695';
const pids = ['69dc8488d9a014acc4f923bd','69dc887dd9a014acc4f9267a'];
for (const pid of pids) {
  try {
    const r = await db.collection('parkinglots').updateOne({ _id: new ObjectId(pid) }, { $set: { owner: new ObjectId(manager), updatedAt: new Date() } });
    console.log(pid, 'matched=', r.matchedCount, 'modified=', r.modifiedCount);
  } catch (e) {
    console.log('Error updating', pid, e.message);
  }
}
await client.close();
console.log('done');
