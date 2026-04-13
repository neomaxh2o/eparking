import mongoose, { Schema, Document } from 'mongoose';

export interface IAbonadoVehiculo {
  patente: string;
  modelo?: string;
  categoria?: string;
  activo: boolean;
}

export interface IAbonadoAcceso {
  tipo: 'qr' | 'rfid' | 'manual' | 'otro';
  valor: string;
  descripcion?: string;
  activo: boolean;
}

export interface IAbonado extends Document {
  clientId: mongoose.Types.ObjectId;
  numeroAbonado: number;
  ownerId?: mongoose.Types.ObjectId | null;
  assignedParking?: mongoose.Types.ObjectId | null;
  estado: 'activo' | 'suspendido' | 'vencido';
  nombre?: string;
  apellido?: string;
  dni?: string;
  telefono?: string;
  ciudad?: string;
  domicilio?: string;
  email?: string;
  vehiculos: IAbonadoVehiculo[];
  accesos: IAbonadoAcceso[];
  observaciones?: string;
  fechaAlta: Date;
  fechaVencimiento?: Date | null;
  billingMode?: 'mensual' | 'diaria' | 'hora';
  tarifaId?: string;
  tarifaNombre?: string;
  importeBase?: number;
  tarifaSnapshot?: Record<string, unknown>;
}

const AbonadoVehiculoSchema = new Schema<IAbonadoVehiculo>(
  {
    patente: { type: String, required: true },
    modelo: { type: String },
    categoria: { type: String },
    activo: { type: Boolean, default: true },
  },
  { _id: false },
);

const AbonadoAccesoSchema = new Schema<IAbonadoAcceso>(
  {
    tipo: { type: String, enum: ['qr', 'rfid', 'manual', 'otro'], required: true },
    valor: { type: String, required: true },
    descripcion: { type: String },
    activo: { type: Boolean, default: true },
  },
  { _id: false },
);

const AbonadoSchema = new Schema<IAbonado>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true, unique: true },
    numeroAbonado: { type: Number, required: true, unique: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    assignedParking: { type: Schema.Types.ObjectId, ref: 'ParkingLot', default: null, index: true },
    estado: { type: String, enum: ['activo', 'suspendido', 'vencido'], default: 'activo' },
    nombre: { type: String },
    apellido: { type: String },
    dni: { type: String },
    telefono: { type: String },
    ciudad: { type: String },
    domicilio: { type: String },
    email: { type: String },
    vehiculos: { type: [AbonadoVehiculoSchema], default: [] },
    accesos: { type: [AbonadoAccesoSchema], default: [] },
    observaciones: { type: String },
    fechaAlta: { type: Date, default: Date.now },
    fechaVencimiento: { type: Date, default: null },
    billingMode: { type: String, enum: ['mensual', 'diaria', 'hora'], default: 'mensual' },
    tarifaId: { type: String, default: '' },
    tarifaNombre: { type: String, default: '' },
    importeBase: { type: Number, default: 0 },
    tarifaSnapshot: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export default mongoose.models.Abonado || mongoose.model<IAbonado>('Abonado', AbonadoSchema);
