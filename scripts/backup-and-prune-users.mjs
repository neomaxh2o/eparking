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
if (!MONGODB_URI) {
  console.error('MONGODB_URI not found in env or INSTALL/.env.local');
  process.exit(2);
}

const KEEP_EMAIL = 'bitron_manager@intradiatrading.com.ar';
const backupDir = path.resolve(process.cwd(), 'backups');
if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
const ts = new Date().toISOString().replace(/[:.]/g, '-');
const backupFile = path.join(backupDir, `users-backup-${ts}.json`);

(async () => {
  const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  try {
    await client.connect();
    const db = client.db();
    const users = await db.collection('users').find({}).toArray();
    fs.writeFileSync(backupFile, JSON.stringify(users, null, 2), { mode: 0o600 });
    console.log('Backup written to:', backupFile, ' (count:', users.length, ')');

    const res = await db.collection('users').deleteMany({ email: { $ne: KEEP_EMAIL } });
    console.log('Deleted count:', res.deletedCount);

    const remain = await db.collection('users').find({}).project({ email:1, role:1 }).toArray();
    console.log('Remaining users:');
    for (const r of remain) console.log('-', r._id?.toString?.() || '-', r.email, '-', r.role || '-');

  } catch (e) {
    console.error('Error:', e.message);
    process.exit(3);
  } finally {
    await client.close();
  }
})();
