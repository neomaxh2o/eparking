#!/usr/bin/env node
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

async function main() {
  const envPath = path.resolve(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim();
      if (!(key in process.env)) process.env[key] = value;
    }
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI no definido');

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();

  const indexes = await db.collection('turnos').indexes();
  const abiertosAdmin = await db.collection('turnos').find({ esCajaAdministrativa: true, estado: 'abierto' }).sort({ createdAt: -1 }).limit(20).toArray();
  const abiertos = await db.collection('turnos').find({ estado: 'abierto' }).sort({ createdAt: -1 }).limit(20).toArray();

  console.log(JSON.stringify({
    indexes,
    abiertosAdmin,
    abiertos,
  }, null, 2));

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
