import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/e-parking';
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
await client.connect();
const db = client.db();

const email = 'bitron_manager@intradiatrading.com.ar';
const passwordPlain = 'MngBitron2026!';
const hashed = await bcrypt.hash(passwordPlain, 10);

let user = await db.collection('users').findOne({ email });
if (!user) {
  const res = await db.collection('users').insertOne({
    name: 'Bitron Manager',
    email,
    password: hashed,
    role: 'owner',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  user = { _id: res.insertedId };
  console.log('Created manager id:', res.insertedId.toString());
} else {
  console.log('Manager already exists id:', user._id.toString());
}

// Assign as owner to Parking Center and Parking Corrientes
const parkingIds = ['69dc8488d9a014acc4f923bd','69dc887dd9a014acc4f9267a'];
for (const pid of parkingIds) {
  try {
    const r = await db.collection('parkinglots').findOneAndUpdate(
      { _id: new ObjectId(pid) },
      { $set: { owner: new ObjectId(user._id), updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    if (r.value) console.log('Assigned owner to parking', pid, '->', r.value.name);
    else console.log('Parking not found:', pid);
  } catch (e) {
    console.log('Error assigning parking', pid, e.message);
  }
}

await client.close();
console.log('\ndone - manager credentials:\n email:', email, '\n password:', passwordPlain);