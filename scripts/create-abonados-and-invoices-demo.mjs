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

// demo parking and tarifa ids
const demoParkingId = new ObjectId('69dd71963b07862baa8a136c');
const tarifaAutoId = '69dd7a5158b655065d5557c4';
const tarifaCamId = '69dd7a5158b655065d5557c9';

(async () => {
  const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  try {
    await client.connect();
    const db = client.db();

    const entries = [];

    // autos: demo_client_1..3
    for (let i=1;i<=3;i++){
      const email = `demo_client_${i}@eparking.com.ar`;
      const user = await db.collection('users').findOne({ email });
      if (!user) { console.log('User missing', email); continue; }

      // create abonado
      const last = await db.collection('abonados').findOne({}, { projection: { numeroAbonado: 1 }, sort: { numeroAbonado: -1 } });
      const num = Number((last && last.numeroAbonado) || 0) + 1;
      const abonadoDoc = {
        clientId: user._id,
        numeroAbonado: num,
        ownerId: user._id, // owner is the user themselves? leave null
        assignedParking: demoParkingId,
        estado: 'activo',
        nombre: `AutoClient${i}`,
        apellido: `Demo${i}`,
        dni: `DNI${1000+i}`,
        telefono: `+54911${1000000+i}`,
        ciudad: 'Ciudad Demo',
        domicilio: 'Demo 123',
        email: user.email,
        vehiculos: [{ patente: `AAA0${i}BC`, modelo: `Model${i}`, categoria: 'Automóvil', activo: true }],
        accesos: [],
        observaciones: 'Alta demo automatizada',
        fechaAlta: new Date(),
        fechaVencimiento: null,
        billingMode: 'mensual',
        tarifaId: tarifaAutoId,
        tarifaNombre: 'Automóvil · mensual',
        importeBase: 140000,
        tarifaSnapshot: {},
      };
      const r = await db.collection('abonados').insertOne(abonadoDoc);

      // create invoice
      const invoice = {
        abonadoId: r.insertedId,
        clientId: user._id,
        ownerId: null,
        assignedParking: demoParkingId,
        tarifaId: tarifaAutoId,
        tipoFacturacion: 'mensual',
        periodoLabel: '2026-04',
        fechaEmision: new Date(),
        fechaVencimiento: null,
        estado: 'emitida',
        monto: 140000,
        moneda: 'ARS',
        snapshot: {},
        sourceType: 'abonado',
        sourceId: String(r.insertedId),
      };
      const invRes = await db.collection('abonadoinvoices').insertOne(invoice);
      // mark paid
      await db.collection('abonadoinvoices').updateOne({ _id: invRes.insertedId }, { $set: { estado: 'pagada', fechaPago: new Date(), paymentMethod: 'efectivo', paymentProvider: 'manual', acreditadoAutomaticamente: true } });

      entries.push({ abonadoId: r.insertedId.toString(), invoiceId: invRes.insertedId.toString(), email });
    }

    // camionetas: demo_client_4..5
    for (let i=4;i<=5;i++){
      const email = `demo_client_${i}@eparking.com.ar`;
      const user = await db.collection('users').findOne({ email });
      if (!user) { console.log('User missing', email); continue; }

      const last = await db.collection('abonados').findOne({}, { projection: { numeroAbonado: 1 }, sort: { numeroAbonado: -1 } });
      const num = Number((last && last.numeroAbonado) || 0) + 1;
      const abonadoDoc = {
        clientId: user._id,
        numeroAbonado: num,
        ownerId: user._id,
        assignedParking: demoParkingId,
        estado: 'activo',
        nombre: `CamClient${i}`,
        apellido: `Demo${i}`,
        dni: `DNI${2000+i}`,
        telefono: `+54911${2000000+i}`,
        ciudad: 'Ciudad Demo',
        domicilio: 'Demo 123',
        email: user.email,
        vehiculos: [{ patente: `BBB0${i}CD`, modelo: `ModelC${i}`, categoria: 'Camioneta', activo: true }],
        accesos: [],
        observaciones: 'Alta demo camioneta',
        fechaAlta: new Date(),
        fechaVencimiento: null,
        billingMode: 'mensual',
        tarifaId: tarifaCamId,
        tarifaNombre: 'Camioneta · mensual',
        importeBase: 147000,
        tarifaSnapshot: {},
      };
      const r = await db.collection('abonados').insertOne(abonadoDoc);

      const invoice = {
        abonadoId: r.insertedId,
        clientId: user._id,
        ownerId: null,
        assignedParking: demoParkingId,
        tarifaId: tarifaCamId,
        tipoFacturacion: 'mensual',
        periodoLabel: '2026-04',
        fechaEmision: new Date(),
        fechaVencimiento: null,
        estado: 'emitida',
        monto: 147000,
        moneda: 'ARS',
        snapshot: {},
        sourceType: 'abonado',
        sourceId: String(r.insertedId),
      };
      const invRes = await db.collection('abonadoinvoices').insertOne(invoice);
      await db.collection('abonadoinvoices').updateOne({ _id: invRes.insertedId }, { $set: { estado: 'pagada', fechaPago: new Date(), paymentMethod: 'efectivo', paymentProvider: 'manual', acreditadoAutomaticamente: true } });

      entries.push({ abonadoId: r.insertedId.toString(), invoiceId: invRes.insertedId.toString(), email });
    }

    console.log('Created abonados and invoices:', entries);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(3);
  } finally {
    await client.close();
  }
})();
