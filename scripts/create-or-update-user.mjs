import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
const envPath = path.resolve(process.cwd(), 'INSTALL/.env.local');
let MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI && fs.existsSync(envPath)) {
  const envRaw = fs.readFileSync(envPath, 'utf8');
  const m = envRaw.match(/MONGODB_URI\s*=\s*"?([^"\n]+)"?/);
  if (m) MONGODB_URI = m[1].trim();
}
if (!MONGODB_URI) { console.error('MONGODB_URI not found'); process.exit(2); }

const email = process.argv[2] || 'test@eparking.com.ar';
const password = process.argv[3] || '435454';
const name = process.argv[4] || 'Test User';
const role = process.argv[5] || 'owner';

(async () => {
  const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  try {
    await client.connect();
    const db = client.db();
    const hashed = await bcrypt.hash(password, 10);
    const existing = await db.collection('users').findOne({ email });
    if (existing) {
      await db.collection('users').updateOne({ _id: existing._id }, { $set: { password: hashed, role, name, updatedAt: new Date() } });
      console.log('Updated existing user:', email, 'id:', existing._id.toString());
    } else {
      const res = await db.collection('users').insertOne({ name, email, password: hashed, role, createdAt: new Date(), updatedAt: new Date() });
      console.log('Created user:', email, 'id:', res.insertedId.toString());
    }
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(3);
  } finally {
    await client.close();
  }
})();
