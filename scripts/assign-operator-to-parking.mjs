import { MongoClient, ObjectId } from 'mongodb';
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/e-parking';
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
await client.connect();
const db = client.db();
const userId = '69dc89c740b8f5fddaaf441a';
const parkingId = '69dc887dd9a014acc4f9267a';
try {
  const res = await db.collection('users').findOneAndUpdate(
    { _id: new ObjectId(userId) },
    { $set: { assignedParking: new ObjectId(parkingId), updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
  if (res.value) console.log('updated user:', res.value._id.toString(), 'assignedParking=', res.value.assignedParking?.toString());
  else console.log('user not found');
} catch (e) {
  console.error('error:', e.message);
}
await client.close();
console.log('done');
