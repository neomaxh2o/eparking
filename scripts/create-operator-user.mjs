import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/e-parking';
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
await client.connect();
const db = client.db();

const email = 'bitron_oper@intradiatrading.com.ar';
const passwordPlain = 'OpBitron2026!';
const hashed = await bcrypt.hash(passwordPlain, 10);

const existing = await db.collection('users').findOne({ email });
if (existing) {
  console.log('User already exists:', existing._id.toString());
} else {
  const res = await db.collection('users').insertOne({
    name: 'Bitron Oper',
    email,
    password: hashed,
    role: 'operator',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  console.log('Created user id:', res.insertedId.toString());
}

await client.close();
console.log('done');
