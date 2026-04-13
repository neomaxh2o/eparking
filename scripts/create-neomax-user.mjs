import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/e-parking';
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
await client.connect();
const db = client.db();

const email = 'neomaxh2o@gmail.com';
const passwordPlain = '435455';
const hashed = await bcrypt.hash(passwordPlain, 10);

let user = await db.collection('users').findOne({ email });
if (!user) {
  const res = await db.collection('users').insertOne({
    name: 'Neo Max H2O',
    email,
    password: hashed,
    role: 'owner',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  console.log('Created owner id:', res.insertedId.toString());
} else {
  console.log('User already exists id:', user._id.toString());
}

await client.close();
console.log('\ndone - owner credentials:\n email:', email, '\n password:', passwordPlain);
