import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const uri = process.env.MONGODB_URI || 'mongodb://bitronclaw:435455Bitronclaw!@127.0.0.1:27017/e-parking?authSource=admin';
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });

const OWNER_ID = '69e106bf9592f4d75f2414ea';
const OWNER_EMAIL = 'owner@eparking.com';
const TARGETS = {
  abonadoInvoiceId: '69e3f719140fca5218dfa677',
  abonadoId: '69e3f719140fca5218dfa672',
  clientUserId: '69e3f595140fca5218dfa5c5',
  clientEmail: 'cliente@eparking.com',
};

function oid(value) { return new ObjectId(value); }
function nowIso() { return new Date().toISOString(); }
function periodLabel(date = new Date()) { return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`; }
function plusDays(days) { const d = new Date(); d.setUTCDate(d.getUTCDate() + days); return d; }
function sanitize(doc) { return JSON.parse(JSON.stringify(doc, (_, v) => v instanceof ObjectId ? String(v) : v)); }

async function countObjectIdRefs(db, ids) {
  const collections = await db.listCollections().toArray();
  const report = {};
  for (const rawId of ids) {
    const id = oid(rawId);
    report[rawId] = {};
    for (const { name } of collections) {
      const count = await db.collection(name).countDocuments({
        $or: [
          { _id: id },
          { abonadoId: id },
          { clientId: id },
          { ownerId: id },
          { userId: id },
          { operatorId: id },
          { assignedParking: id },
          { linkedDocumentIds: id },
          { sourceId: rawId },
          { 'snapshot.parking.id': rawId },
          { 'snapshot.abonado.id': rawId },
          { 'snapshot.abonado.clientId': rawId },
        ],
      });
      if (count) report[rawId][name] = count;
    }
  }
  return report;
}

async function main() {
  await client.connect();
  const db = client.db();
  const users = db.collection('users');
  const abonados = db.collection('abonados');
  const invoices = db.collection('abonadoinvoices');
  const parkingsCol = db.collection('parkinglots');
  const tarifas = db.collection('tarifas');

  const ownerId = oid(OWNER_ID);
  const owner = await users.findOne({ _id: ownerId, email: OWNER_EMAIL, role: 'owner' });
  if (!owner) throw new Error(`Owner ${OWNER_EMAIL} / ${OWNER_ID} not found`);

  const ownerParkings = await parkingsCol.find({ owner: ownerId }).sort({ createdAt: 1, _id: 1 }).toArray();
  if (!ownerParkings.length) throw new Error('Owner has no parkings; aborting');

  const targetAbonado = await abonados.findOne({ _id: oid(TARGETS.abonadoId) });
  const targetInvoice = await invoices.findOne({ _id: oid(TARGETS.abonadoInvoiceId) });
  const targetUser = await users.findOne({ _id: oid(TARGETS.clientUserId) });

  const deletedCounts = { abonadoinvoices: 0, abonados: 0, users: 0 };

  if (targetInvoice) {
    const res = await invoices.deleteOne({ _id: oid(TARGETS.abonadoInvoiceId) });
    deletedCounts.abonadoinvoices += res.deletedCount;
  }

  if (targetAbonado) {
    const res = await abonados.deleteOne({ _id: oid(TARGETS.abonadoId) });
    deletedCounts.abonados += res.deletedCount;
  }

  if (targetUser) {
    if (String(targetUser.role) !== 'client') throw new Error('Target user exists but is not role=client; aborting');
    if (String(targetUser.email).toLowerCase() !== TARGETS.clientEmail) throw new Error('Target user email mismatch; aborting');
    const res = await users.deleteOne({ _id: oid(TARGETS.clientUserId), role: 'client', email: TARGETS.clientEmail });
    deletedCounts.users += res.deletedCount;
  }

  const postDeleteValidation = {
    ownerStillExists: Boolean(await users.findOne({ _id: ownerId, email: OWNER_EMAIL, role: 'owner' }, { projection: { _id: 1 } })),
    parkingsStillExist: await parkingsCol.countDocuments({ owner: ownerId }),
    targetInvoiceZero: await invoices.countDocuments({ _id: oid(TARGETS.abonadoInvoiceId) }),
    targetAbonadoZero: await abonados.countDocuments({ _id: oid(TARGETS.abonadoId) }),
    targetUserZero: await users.countDocuments({ _id: oid(TARGETS.clientUserId) }),
    remainingReferences: await countObjectIdRefs(db, [TARGETS.abonadoInvoiceId, TARGETS.abonadoId, TARGETS.clientUserId]),
  };

  const firstParking = ownerParkings[0];
  const secondParking = ownerParkings[1] ?? null;
  const testEmail = `cliente.reset.${Date.now()}@eparking.com`;
  const plainPassword = 'ResetTest123!';
  const password = await bcrypt.hash(plainPassword, 10);
  const tarifa = await tarifas.findOne({ parkinglotId: firstParking._id }, { sort: { createdAt: 1, _id: 1 } });

  if (!tarifa) throw new Error(`No tarifa found for parking ${firstParking._id}`);

  const lastAbonado = await abonados.findOne({}, { projection: { numeroAbonado: 1 }, sort: { numeroAbonado: -1 } });
  const numeroAbonado = Number(lastAbonado?.numeroAbonado || 0) + 1;

  const userInsert = await users.insertOne({
    name: 'CLIENTE RESET TEST',
    nombre: 'CLIENTE',
    apellido: 'RESET TEST',
    email: testEmail,
    password,
    role: 'client',
    telefono: '0000000000',
    ciudad: 'Cordoba',
    domicilio: 'Reset Street 123',
    patenteVehiculo: 'RST123',
    modeloVehiculo: 'TestCar',
    categoriaVehiculo: 'Automóvil',
    assignedParking: firstParking._id,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const newClientId = userInsert.insertedId;
  const tarifaId = String(tarifa._id);
  const monthlyTier = Array.isArray(tarifa.tarifaMensual) && tarifa.tarifaMensual.length
    ? tarifa.tarifaMensual.find((item) => Number(item?.cantidad) === 1) ?? tarifa.tarifaMensual[0]
    : null;
  const resolvedMonthlyPrice = Number(
    monthlyTier?.precioTotal ?? monthlyTier?.precioConDescuento ?? monthlyTier?.precioUnitario ?? tarifa.price ?? tarifa.precio ?? tarifa.importe ?? 0,
  );
  const tarifaSnapshot = {
    cantidad: 1,
    precioUnitario: resolvedMonthlyPrice,
    bonificacionPorc: Number(monthlyTier?.bonificacionPorc ?? 0),
    precioConDescuento: Number(monthlyTier?.precioConDescuento ?? resolvedMonthlyPrice),
    precioTotal: Number(monthlyTier?.precioTotal ?? resolvedMonthlyPrice),
    tipoEstadia: 'mensual',
    tarifaParentId: tarifaId,
    category: tarifa.category ?? 'Automóvil',
    _id: monthlyTier?._id,
  };
  const importeBase = Number(tarifaSnapshot.precioTotal || 0);
  if (!(importeBase > 0)) throw new Error(`Resolved importeBase is invalid from tarifa ${tarifaId}`);

  const abonadoDoc = {
    clientId: newClientId,
    numeroAbonado,
    ownerId,
    assignedParking: firstParking._id,
    estado: 'activo',
    nombre: 'CLIENTE',
    apellido: 'RESET TEST',
    dni: '99999999',
    telefono: '0000000000',
    ciudad: 'Cordoba',
    domicilio: 'Reset Street 123',
    email: testEmail,
    vehiculos: [{ patente: 'RST123', modelo: 'TestCar', categoria: 'Automóvil', activo: true }],
    accesos: [{ tipo: 'manual', valor: 'RESET-ACCESS', descripcion: 'Reset access', activo: true }],
    observaciones: 'Generated by owner reset functional test',
    fechaVencimiento: plusDays(30),
    billingMode: 'mensual',
    tarifaId,
    tarifaNombre: `${tarifa.category ?? 'Automóvil'} · mensual`,
    importeBase,
    tarifaSnapshot,
    fechaAlta: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const abonadoInsert = await abonados.insertOne(abonadoDoc);
  const newAbonadoId = abonadoInsert.insertedId;

  const currentPeriod = periodLabel();
  const invoiceCode = `ABO:${String(newAbonadoId)}:${currentPeriod}:${Date.now()}`;
  const invoiceDoc = {
    abonadoId: newAbonadoId,
    clientId: newClientId,
    ownerId,
    assignedParking: firstParking._id,
    tarifaId,
    invoiceCode,
    voucherType: 'consumidor_final',
    customerTaxCondition: 'consumidor_final',
    customerDocumentType: 'dni',
    customerDocumentNumber: '99999999',
    customerBusinessName: 'CLIENTE RESET TEST',
    pointOfSale: '',
    sourceType: 'abonado',
    sourceId: String(newAbonadoId),
    paymentReference: invoiceCode,
    tipoFacturacion: 'mensual',
    periodoLabel: currentPeriod,
    fechaEmision: new Date(),
    fechaVencimiento: abonadoDoc.fechaVencimiento,
    estado: 'emitida',
    monto: importeBase,
    moneda: 'ARS',
    snapshot: {
      abonado: {
        nombre: abonadoDoc.nombre,
        apellido: abonadoDoc.apellido,
        email: abonadoDoc.email,
      },
      tarifaNombre: abonadoDoc.tarifaNombre,
      tarifaSnapshot,
      source: 'abonado',
      fiscal: {
        source: 'fallback',
        status: 'invalid',
        pointOfSale: '',
        businessName: 'CLIENTE RESET TEST',
      },
      parking: {
        id: String(firstParking._id),
        name: String(firstParking.name ?? ''),
        ownerId: OWNER_ID,
        billingProfile: (firstParking.billingProfile && typeof firstParking.billingProfile === 'object') ? firstParking.billingProfile : null,
      },
    },
    origen: 'admin',
    turnoId: null,
    cajaNumero: null,
    operatorId: null,
    paymentProvider: '',
    paymentMethod: '',
    acreditadoAutomaticamente: false,
    externalStatus: '',
    billingClosureId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const invoiceInsert = await invoices.insertOne(invoiceDoc);
  const newInvoiceId = invoiceInsert.insertedId;

  const invoiceByParking = await invoices.find({ ownerId, assignedParking: firstParking._id, sourceType: 'abonado' }).toArray();
  const invoiceByOtherParking = secondParking
    ? await invoices.find({ ownerId, assignedParking: secondParking._id, sourceType: 'abonado', _id: newInvoiceId }).toArray()
    : [];
  const invoiceOwnerGlobal = await invoices.find({ ownerId, _id: newInvoiceId }).toArray();
  const createdAbonado = await abonados.findOne({ _id: newAbonadoId });

  const functionalTest = {
    createdClientId: String(newClientId),
    createdAbonadoId: String(newAbonadoId),
    createdInvoiceId: String(newInvoiceId),
    createdClientEmail: testEmail,
    targetParkingId: String(firstParking._id),
    targetParkingName: String(firstParking.name ?? ''),
    comparisonParkingId: secondParking ? String(secondParking._id) : null,
    comparisonParkingName: secondParking ? String(secondParking.name ?? '') : null,
    assignedParkingMatches: String(createdAbonado.assignedParking) === String(firstParking._id),
    invoiceVisibleInTargetParking: invoiceByParking.some((doc) => String(doc._id) === String(newInvoiceId)),
    invoiceReplicatedToOtherParking: invoiceByOtherParking.some((doc) => String(doc._id) === String(newInvoiceId)),
    invoiceVisibleOwnerWide: invoiceOwnerGlobal.some((doc) => String(doc._id) === String(newInvoiceId)),
    invoiceSnapshotParkingMatches: String(invoiceDoc.snapshot.parking.id) === String(firstParking._id),
    amount: importeBase,
    tarifaId,
  };

  const summary = {
    ownerEmail: OWNER_EMAIL,
    ownerId: OWNER_ID,
    timestamp: nowIso(),
    deletedByCollection: deletedCounts,
    deletedIds: TARGETS,
    preDeleteFound: {
      abonadoInvoice: Boolean(targetInvoice),
      abonado: Boolean(targetAbonado),
      clientUser: Boolean(targetUser),
    },
    postDeleteValidation,
    minimalFunctionalTest: functionalTest,
  };

  const summaryPath = path.join(process.cwd(), 'owner-reset-summary.md');
  const md = [
    '# Owner reset summary',
    '',
    `- Owner email: ${OWNER_EMAIL}`,
    `- Owner ID: ${OWNER_ID}`,
    `- Timestamp (UTC): ${summary.timestamp}`,
    '',
    '## Deleted documents by collection',
    '',
    `- abonadoinvoices: ${deletedCounts.abonadoinvoices}`,
    `- abonados: ${deletedCounts.abonados}`,
    `- users: ${deletedCounts.users}`,
    '',
    '## Deleted target IDs',
    '',
    `- abonadoinvoice: ${TARGETS.abonadoInvoiceId}`,
    `- abonado: ${TARGETS.abonadoId}`,
    `- client user: ${TARGETS.clientUserId} (${TARGETS.clientEmail})`,
    '',
    '## Post-delete validation',
    '',
    `- ownerStillExists: ${postDeleteValidation.ownerStillExists}`,
    `- parkingsStillExist: ${postDeleteValidation.parkingsStillExist}`,
    `- targetInvoiceZero: ${postDeleteValidation.targetInvoiceZero}`,
    `- targetAbonadoZero: ${postDeleteValidation.targetAbonadoZero}`,
    `- targetUserZero: ${postDeleteValidation.targetUserZero}`,
    `- remainingReferences: \`${JSON.stringify(postDeleteValidation.remainingReferences)}\``,
    '',
    '## Minimal functional post-reset test',
    '',
    `- createdClientId: ${functionalTest.createdClientId}`,
    `- createdClientEmail: ${functionalTest.createdClientEmail}`,
    `- createdAbonadoId: ${functionalTest.createdAbonadoId}`,
    `- createdInvoiceId: ${functionalTest.createdInvoiceId}`,
    `- targetParking: ${functionalTest.targetParkingName} (${functionalTest.targetParkingId})`,
    `- comparisonParking: ${functionalTest.comparisonParkingName ?? 'N/A'}${functionalTest.comparisonParkingId ? ` (${functionalTest.comparisonParkingId})` : ''}`,
    `- assignedParkingMatches: ${functionalTest.assignedParkingMatches}`,
    `- invoiceVisibleInTargetParking: ${functionalTest.invoiceVisibleInTargetParking}`,
    `- invoiceReplicatedToOtherParking: ${functionalTest.invoiceReplicatedToOtherParking}`,
    `- invoiceVisibleOwnerWide: ${functionalTest.invoiceVisibleOwnerWide}`,
    `- invoiceSnapshotParkingMatches: ${functionalTest.invoiceSnapshotParkingMatches}`,
    `- tarifaId: ${functionalTest.tarifaId}`,
    `- amount: ${functionalTest.amount}`,
    '',
    '## Raw summary JSON',
    '',
    '```json',
    JSON.stringify(sanitize(summary), null, 2),
    '```',
    '',
  ].join('\n');

  fs.writeFileSync(summaryPath, md, 'utf8');
  console.log(JSON.stringify(sanitize(summary), null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await client.close();
});
