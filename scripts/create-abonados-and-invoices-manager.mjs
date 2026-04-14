import { MongoClient, ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
const envPath = path.resolve(process.cwd(), 'INSTALL/.env.local');
let MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI && fs.existsSync(envPath)) {
  const envRaw = fs.readFileSync(envPath, 'utf8');
  const m = envRaw.match(/MONGODB_URI\s*=\s*"?([^"\n]+)"?/);
  if (m) MONGODB_URI = m[1].trim();
}
if (!MONGODB_URI) { console.error('MONGODB_URI not found'); process.exit(2); }

const managerId = new ObjectId('69dca4378a4f767e4e1f91d4');

(async () => {
  const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  try {
    await client.connect();
    const db = client.db();

    const managerParkings = await db.collection('parkinglots').find({ owner: managerId }).toArray();
    if (!managerParkings.length) { console.log('No manager parkings found'); process.exit(0); }
    console.log('Manager parkings:', managerParkings.map(p => p._id.toString()));

    for (const p of managerParkings) {
      const parkingId = p._id;
      // find tarifas for this parking
      const tarifaAuto = await db.collection('tarifas').findOne({ parkinglotId: parkingId, category: 'Automóvil' });
      const tarifaCam = await db.collection('tarifas').findOne({ parkinglotId: parkingId, category: 'Camioneta' });

      // find manager clients assigned to this parking (created earlier with pattern mgr1_client_*)
      const clients = await db.collection('users').find({ assignedParking: parkingId, role: 'client' }).toArray();
      console.log('clients for parking', parkingId.toString(), clients.map(c=>c.email));

      for (const clientUser of clients) {
        // create abonado for each client
        const last = await db.collection('abonados').findOne({}, { projection: { numeroAbonado: 1 }, sort: { numeroAbonado: -1 } });
        const num = Number((last && last.numeroAbonado) || 0) + 1;
        // choose category based on email pattern: mgr1_client_1..3 -> autos, 4..5 -> camionetas (heuristic)
        const match = clientUser.email.match(/mgr\d+_client_(\d+)@/);
        let categoria = 'Automóvil';
        let tarifaId = tarifaAuto ? tarifaAuto._id.toString() : '';
        let monto = tarifaAuto ? (tarifaAuto.tarifaMensual?.[0]?.precioTotal ?? tarifaAuto.tarifasHora?.[0]?.precioTotal ?? 0) : 0;
        if (match && Number(match[1]) >= 4) {
          categoria = 'Camioneta';
          tarifaId = tarifaCam ? tarifaCam._id.toString() : tarifaId;
          monto = tarifaCam ? (tarifaCam.tarifaMensual?.[0]?.precioTotal ?? tarifaCam.tarifasHora?.[0]?.precioTotal ?? monto) : monto;
        }

        const abonadoDoc = {
          clientId: clientUser._id,
          numeroAbonado: num,
          ownerId: managerId,
          assignedParking: parkingId,
          estado: 'activo',
          nombre: clientUser.name || clientUser.email.split('@')[0],
          apellido: 'Client',
          dni: `MGR${num}`,
          telefono: '+549110000000',
          ciudad: 'Ciudad Mgr',
          domicilio: 'Direccion Mgr',
          email: clientUser.email,
          vehiculos: [{ patente: `MGR${num}X`, modelo: 'ModelM', categoria, activo: true }],
          accesos: [],
          observaciones: 'Alta manager demo',
          fechaAlta: new Date(),
          fechaVencimiento: null,
          billingMode: 'mensual',
          tarifaId: tarifaId,
          tarifaNombre: `${categoria} · mensual`,
          importeBase: monto,
          tarifaSnapshot: {},
        };
        const r = await db.collection('abonados').insertOne(abonadoDoc);

        // create & pay invoice
        const invoice = {
          abonadoId: r.insertedId,
          clientId: clientUser._id,
          ownerId: managerId,
          assignedParking: parkingId,
          tarifaId: tarifaId,
          tipoFacturacion: 'mensual',
          periodoLabel: '2026-04',
          fechaEmision: new Date(),
          fechaVencimiento: null,
          estado: 'emitida',
          monto: monto,
          moneda: 'ARS',
          snapshot: {},
          sourceType: 'abonado',
          sourceId: String(r.insertedId),
        };
        const invRes = await db.collection('abonadoinvoices').insertOne(invoice);
        await db.collection('abonadoinvoices').updateOne({ _id: invRes.insertedId }, { $set: { estado: 'pagada', fechaPago: new Date(), paymentMethod: 'efectivo', paymentProvider: 'manual', acreditadoAutomaticamente: true } });

        console.log('Created abonado & invoice for', clientUser.email, 'abonadoId=', r.insertedId.toString());
      }
    }

    console.log('DONE for all manager parkings');
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(3);
  } finally {
    await client.close();
  }
})();
