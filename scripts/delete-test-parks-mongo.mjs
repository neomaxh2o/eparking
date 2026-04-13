import { MongoClient, ObjectId } from 'mongodb';
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/e-parking';
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
await client.connect();
const db = client.db();
const ids = ['69dc84a5d9a014acc4f923c2','69dc8566d9a014acc4f923c4'];
for (const id of ids) {
  try {
    const res = await db.collection('parkinglots').deleteOne({ _id: new ObjectId(id) });
    if (res.deletedCount && res.deletedCount > 0) console.log(`Deleted parking ${id}`);
    else console.log(`Parking ${id} not found`);
  } catch (e) {
    console.log(`Error deleting ${id}: ${e.message}`);
  }
}
await client.close();
console.log('done');
