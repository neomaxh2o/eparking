import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/e-parking';
await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });

const UserSchema = new mongoose.Schema({
  name: String, email: { type: String, unique: true }, password: String, role: String, assignedParking: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingLot', default: null },
  nombre: String, apellido: String, dni: String, telefono: String, ciudad: String, domicilio: String, patenteVehiculo: String, modeloVehiculo: String, categoriaVehiculo: String,
}, { timestamps: true });
const ParkingLotSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, name: String,
  location: { lat: Number, lng: Number, address: String }, totalSpots: Number, availableSpots: Number, pricePerHour: Number, schedule: { open: String, close: String }, isAvailable: Boolean,
}, { timestamps: true });
const TarifaSchema = new mongoose.Schema({
  parkinglotId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingLot', required: true }, category: String,
  tarifasHora: [{ cantidad: Number, precioUnitario: Number, bonificacionPorc: Number, precioConDescuento: Number, precioTotal: Number, tipoEstadia: String }],
  tarifasPorDia: [{ cantidad: Number, precioUnitario: Number, bonificacionPorc: Number, precioConDescuento: Number, precioTotal: Number, tipoEstadia: String }],
  tarifaMensual: [{ cantidad: Number, precioUnitario: Number, bonificacionPorc: Number, precioConDescuento: Number, precioTotal: Number, tipoEstadia: String }],
  tarifaLibre: [{ precioUnitario: Number, bonificacionPorc: Number, precioConDescuento: Number, precioTotal: Number, tipoEstadia: String }],
}, { timestamps: true });
const AbonadoSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, assignedParking: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingLot' },
  estado: String, nombre: String, apellido: String, dni: String, telefono: String, ciudad: String, domicilio: String, email: String,
  vehiculos: [{ patente: String, modelo: String, categoria: String, activo: Boolean }],
  accesos: [{ tipo: String, valor: String, descripcion: String, activo: Boolean }],
  observaciones: String, fechaAlta: Date, fechaVencimiento: Date, billingMode: String, tarifaId: String, tarifaNombre: String, importeBase: Number, tarifaSnapshot: mongoose.Schema.Types.Mixed,
}, { timestamps: true });
const AbonadoInvoiceSchema = new mongoose.Schema({
  abonadoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Abonado' }, clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, assignedParking: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingLot' },
  tarifaId: String, tipoFacturacion: String, periodoLabel: String, fechaEmision: Date, fechaVencimiento: Date, fechaPago: Date, estado: String, monto: Number, moneda: String, snapshot: mongoose.Schema.Types.Mixed,
  origen: String, invoiceCode: String, paymentProvider: String, paymentReference: String, paymentMethod: String, acreditadoAutomaticamente: Boolean, externalStatus: String, externalPayload: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const ParkingLot = mongoose.models.ParkingLot || mongoose.model('ParkingLot', ParkingLotSchema);
const Tarifa = mongoose.models.Tarifa || mongoose.model('Tarifa', TarifaSchema);
const Abonado = mongoose.models.Abonado || mongoose.model('Abonado', AbonadoSchema);
const AbonadoInvoice = mongoose.models.AbonadoInvoice || mongoose.model('AbonadoInvoice', AbonadoInvoiceSchema);

const password = await bcrypt.hash('435455', 10);
const ownerEmail = 'neomaxh2o@gmail.com';
let owner = await User.findOne({ email: ownerEmail });
if (!owner) {
  owner = await User.create({ name: 'QA Owner', email: ownerEmail, password, role: 'owner', nombre: 'QA', apellido: 'Owner', telefono: '111111111' });
}

let parking = await ParkingLot.findOne({ owner: owner._id, name: 'QA Playa Centro' });
if (!parking) {
  parking = await ParkingLot.create({ owner: owner._id, name: 'QA Playa Centro', location: { lat: -34.6037, lng: -58.3816, address: 'QA Address 123' }, totalSpots: 120, availableSpots: 95, pricePerHour: 2500, schedule: { open: '00:00', close: '23:59' }, isAvailable: true });
}

const categories = [
  ['Automóvil', 2500, 12000, 14000],
  ['Motocicleta', 1500, 8000, 9000],
  ['Camioneta', 3200, 15000, 18000],
];
for (const [category, hour, day, month] of categories) {
  await Tarifa.findOneAndUpdate(
    { parkinglotId: parking._id, category },
    {
      parkinglotId: parking._id,
      category,
      tarifasHora: [{ cantidad: 1, precioUnitario: hour, bonificacionPorc: 0, precioConDescuento: hour, precioTotal: hour, tipoEstadia: 'hora' }],
      tarifasPorDia: [{ cantidad: 1, precioUnitario: day, bonificacionPorc: 0, precioConDescuento: day, precioTotal: day, tipoEstadia: 'dia' }],
      tarifaMensual: [{ cantidad: 1, precioUnitario: month, bonificacionPorc: 0, precioConDescuento: month, precioTotal: month, tipoEstadia: 'mensual' }],
      tarifaLibre: [{ precioUnitario: day, bonificacionPorc: 0, precioConDescuento: day, precioTotal: day, tipoEstadia: 'libre' }],
    },
    { upsert: true, new: true }
  );
}

const autoTarifa = await Tarifa.findOne({ parkinglotId: parking._id, category: 'Automóvil' });
const demoClients = [
  ['qa_cliente_01@demo.local', 'Lucia', 'Paredes', 'AA000AA'],
  ['qa_cliente_02@demo.local', 'Martin', 'Suarez', 'AB111AB'],
  ['qa_cliente_03@demo.local', 'Carla', 'Mendez', 'AC222AC'],
  ['qa_cliente_04@demo.local', 'Diego', 'Lopez', 'AD333AD'],
  ['qa_cliente_05@demo.local', 'Sofia', 'Ruiz', 'AE444AE'],
];

const created = [];
for (let i = 0; i < demoClients.length; i++) {
  const [email, nombre, apellido, patente] = demoClients[i];
  let client = await User.findOne({ email });
  if (!client) {
    client = await User.create({ name: `${nombre} ${apellido}`, email, password, role: 'client', assignedParking: parking._id, nombre, apellido, telefono: `11000000${i}`, ciudad: 'Buenos Aires', domicilio: `QA Street ${i + 1}`, patenteVehiculo: patente, modeloVehiculo: 'Demo', categoriaVehiculo: 'Automóvil' });
  } else if (!client.assignedParking) {
    client.assignedParking = parking._id; await client.save();
  }

  let abonado = await Abonado.findOne({ clientId: client._id });
  if (!abonado) {
    abonado = await Abonado.create({
      clientId: client._id, ownerId: owner._id, assignedParking: parking._id, estado: i === 3 ? 'suspendido' : 'activo', nombre, apellido, telefono: client.telefono, ciudad: client.ciudad, domicilio: client.domicilio, email,
      vehiculos: [{ patente, modelo: 'Demo', categoria: 'Automóvil', activo: true }], accesos: [{ tipo: 'qr', valor: `QA-QR-${i + 1}`, descripcion: 'QA access', activo: true }], observaciones: 'Dato de prueba inyectado',
      fechaAlta: new Date(), fechaVencimiento: new Date(Date.now() + (15 + i) * 86400000), billingMode: 'mensual', tarifaId: String(autoTarifa?._id || ''), tarifaNombre: 'Automóvil · mensual', importeBase: 14000, tarifaSnapshot: autoTarifa?.tarifaMensual?.[0] || {},
    });
  }

  const currentPeriod = '2026-04';
  const statuses = ['pagada', 'emitida', 'vencida', 'pagada', 'pendiente'];
  const status = statuses[i];
  const code = `ABO:${abonado._id}:${currentPeriod}:SEED${i + 1}`;
  const exists = await AbonadoInvoice.findOne({ invoiceCode: code });
  if (!exists) {
    await AbonadoInvoice.create({
      abonadoId: abonado._id, clientId: client._id, ownerId: owner._id, assignedParking: parking._id, tarifaId: String(autoTarifa?._id || ''), tipoFacturacion: 'mensual', periodoLabel: currentPeriod,
      fechaEmision: new Date('2026-04-01T00:00:00Z'), fechaVencimiento: new Date('2026-04-10T00:00:00Z'), fechaPago: status === 'pagada' ? new Date('2026-04-05T12:00:00Z') : null,
      estado: status, monto: 14000, moneda: 'ARS', snapshot: { abonado: { nombre, apellido, email }, tarifaNombre: 'Automóvil · mensual' }, origen: 'admin', invoiceCode: code,
      paymentProvider: status === 'pagada' ? 'electronic' : '', paymentReference: code, paymentMethod: status === 'pagada' ? 'electronic' : '', acreditadoAutomaticamente: status === 'pagada', externalStatus: status === 'pagada' ? 'approved' : '', externalPayload: status === 'pagada' ? { seeded: true } : {},
    });
  }
  created.push({ email, abonadoId: String(abonado._id), status });
}

console.log(JSON.stringify({ ok: true, ownerEmail, parking: parking.name, seededClients: created.length, created }, null, 2));
await mongoose.disconnect();
