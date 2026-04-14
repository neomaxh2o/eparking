import { MongoClient, ObjectId } from 'mongodb';
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

const ownerEmail = process.argv[2] || 'test@eparking.com.ar';
(async () => {
  const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  try {
    await client.connect();
    const db = client.db();
    const user = await db.collection('users').findOne({ email: ownerEmail });
    if (!user) { console.error('Owner user not found:', ownerEmail); process.exit(1); }
    const parking = {
      owner: user._id,
      name: 'Demo Playa Test',
      location: { lat: -34.6037, lng: -58.3816, address: 'Demo Address 123' },
      totalSpots: 50,
      availableSpots: 50,
      pricePerHour: 500, // cents = $5.00
      schedule: { open: '00:00', close: '23:59' },
      isAvailable: true,
      billingProfile: { enabled: false },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const res = await db.collection('parkinglots').insertOne(parking);
    console.log('Created parking id:', res.insertedId.toString());
    // Optionally set assignedParking on user
    await db.collection('users').updateOne({ _id: user._id }, { $set: { assignedParking: res.insertedId, updatedAt: new Date() } });
    console.log('Assigned parking to user:', ownerEmail);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(3);
  } finally {
    await client.close();
  }
})();
