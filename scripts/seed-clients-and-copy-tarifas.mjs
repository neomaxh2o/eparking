import { MongoClient, ObjectId } from 'mongodb';
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

const managerId = '69dca4378a4f767e4e1f91d4';
const demoParkingId = '69dd71963b07862baa8a136c';

(async () => {
  const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  try {
    await client.connect();
    const db = client.db();

    const passwordPlain = 'testclient2026!';
    const hashed = await bcrypt.hash(passwordPlain, 10);

    const createdUsers = [];

    // 5 clients for demo parking
    for (let i=1;i<=5;i++){
      const email = `demo_client_${i}@eparking.com.ar`;
      let u = await db.collection('users').findOne({ email });
      if (!u) {
        const r = await db.collection('users').insertOne({ name: `Demo Client ${i}`, email, password: hashed, role: 'client', assignedParking: new ObjectId(demoParkingId), createdAt: new Date(), updatedAt: new Date() });
        createdUsers.push({ email, password: passwordPlain, id: r.insertedId.toString(), parking: demoParkingId});
      } else {
        await db.collection('users').updateOne({_id: u._id}, {$set:{password:hashed, role:'client', assignedParking: new ObjectId(demoParkingId), updatedAt:new Date()}});
        createdUsers.push({ email, password: passwordPlain, id: u._id.toString(), parking: demoParkingId});
      }
    }

    // Find manager parkings
    const managerParkings = await db.collection('parkinglots').find({ owner: new ObjectId(managerId) }).toArray();
    console.log('Manager parkings found:', managerParkings.map(p=>p._id.toString()));

    // For each manager parking, create 5 clients and copy demo tarifas
    const createdTarifas = [];
    for (let pi=0; pi<managerParkings.length; pi++){
      const p = managerParkings[pi];
      const pid = p._id;
      // create 5 clients
      for (let i=1;i<=5;i++){
        const email = `mgr${pi+1}_client_${i}@eparking.com.ar`;
        let u = await db.collection('users').findOne({ email });
        if (!u) {
          const r = await db.collection('users').insertOne({ name: `Mgr${pi+1} Client ${i}`, email, password: hashed, role: 'client', assignedParking: pid, createdAt: new Date(), updatedAt: new Date() });
          createdUsers.push({ email, password: passwordPlain, id: r.insertedId.toString(), parking: pid.toString()});
        } else {
          await db.collection('users').updateOne({_id: u._id}, {$set:{password:hashed, role:'client', assignedParking: pid, updatedAt:new Date()}});
          createdUsers.push({ email, password: passwordPlain, id: u._id.toString(), parking: pid.toString()});
        }
      }

      // Copy demo tarifas into this parking if not exist
      const existingAuto = await db.collection('tarifas').findOne({ parkinglotId: pid, category: 'Automóvil' });
      if (!existingAuto) {
        const auto = {
          parkinglotId: pid,
          category: 'Automóvil',
          tipoEstadia: 'hora',
          tarifasHora: [{ cantidad:1, precioUnitario:3500, precioTotal:3500, tipoEstadia:'hora'}],
          tarifasPorDia: [{ cantidad:1, precioUnitario:22000, precioTotal:22000, tipoEstadia:'dia'}],
          tarifaMensual: [{ cantidad:1, precioUnitario:140000, precioTotal:140000, tipoEstadia:'mensual'}],
          tarifaLibre: []
        };
        const r = await db.collection('tarifas').insertOne(auto);
        createdTarifas.push({ parking: pid.toString(), category: 'Automóvil', id: r.insertedId.toString() });
      }
      const existingCam = await db.collection('tarifas').findOne({ parkinglotId: pid, category: 'Camioneta' });
      if (!existingCam) {
        const cam = {
          parkinglotId: pid,
          category: 'Camioneta',
          tipoEstadia: 'hora',
          tarifasHora: [{ cantidad:1, precioUnitario:3675, precioTotal:3675, tipoEstadia:'hora'}],
          tarifasPorDia: [{ cantidad:1, precioUnitario:23100, precioTotal:23100, tipoEstadia:'dia'}],
          tarifaMensual: [{ cantidad:1, precioUnitario:147000, precioTotal:147000, tipoEstadia:'mensual'}],
          tarifaLibre: []
        };
        const r = await db.collection('tarifas').insertOne(cam);
        createdTarifas.push({ parking: pid.toString(), category: 'Camioneta', id: r.insertedId.toString() });
      }
    }

    console.log('\nCreated users:', createdUsers);
    console.log('\nCreated tarifas:', createdTarifas);

  } catch (e) {
    console.error('Error:', e.message);
    process.exit(3);
  } finally {
    await client.close();
  }
})();
