import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/e-parking';
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
await client.connect();
const db = client.db();

const email = 'test@eparking.com.ar';
const passwordPlain = '435455';
const hashed = await bcrypt.hash(passwordPlain, 10);

let user = await db.collection('users').findOne({ email });
if (!user) {
  const res = await db.collection('users').insertOne({
    name: 'Test User',
    email,
    password: hashed,
    role: 'owner',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  user = { _id: res.insertedId };
  console.log('Created test user id:', res.insertedId.toString());
} else {
  console.log('User already exists id:', user._id.toString());
  // ensure role is owner and password updated
  await db.collection('users').updateOne({ _id: user._id }, { $set: { role: 'owner', password: hashed, updatedAt: new Date() } });
  console.log('Updated existing user: set role=owner and reset password');
}

await client.close();
console.log('\ndone - test credentials:\n email:', email, '\n password:', passwordPlain);
