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
if (!MONGODB_URI) {
  console.error('MONGODB_URI not found in env or INSTALL/.env.local');
  process.exit(2);
}

const email = process.argv[2] || 'neomaxh2o@gmail.com';
const newPassword = process.argv[3] || '435455';

(async () => {
  const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  try {
    await client.connect();
    const db = client.db();
    const hashed = await bcrypt.hash(newPassword, 10);
    const res = await db.collection('users').findOneAndUpdate(
      { email: email },
      { $set: { password: hashed, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    if (!res.value) {
      console.error('User not found:', email);
      process.exit(1);
    }
    console.log('Password updated for user:', email, 'user id:', res.value._id.toString());
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(3);
  } finally {
    await client.close();
  }
})();
