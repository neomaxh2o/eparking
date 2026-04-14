import { MongoClient } from 'mongodb';
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
(async () => {
  const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  try {
    await client.connect();
    const db = client.db();
    const users = await db.collection('users').find({ role: 'owner' }).project({ email:1, name:1 }).toArray();
    if (!users.length) { console.log('No owners found'); return; }
    for (const u of users) console.log(u._id?.toString?.() || '-', u.email, '-', u.name || '-');
  } catch (e) { console.error('Error:', e.message); } finally { await client.close(); }
})();
