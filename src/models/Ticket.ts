import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export type CategoriaVehiculo =
  | 'Automóvil'
  | 'Camioneta'
  | 'Bicicleta'
  | 'Motocicleta'
  | 'Otros';

export type TipoEstadia = 'hora' | 'dia' | 'libre';
export type MetodoPago = 'efectivo' | 'tarjeta' | 'qr' | 'otros';
export type EstadoTicket = 'activa' | 'cerrada';

export interface IClienteTicket {
  nombre?: string;
  apellido?: string;
  dni?: string;
  telefono?: string;
}

export interface ITarifaSnapshot {
  _id?: Types.ObjectId | string;
  nombre?: string;
  tarifaHora?: number;
  tarifaDia?: number;
  tarifaLibre?: number;
  tarifaBaseHora?: number;
  fraccionMinutos?: number;
}

export interface ITicket extends Document {
  ticketNumber: string;
  patente: string;
  categoria: CategoriaVehiculo;
  cliente?: IClienteTicket;
  tarifaId?: Types.ObjectId | string;
  operadorId?: Types.ObjectId | string;
  horaEntrada: Date;
  horaSalida?: Date;
  estado: EstadoTicket;
  totalCobrado?: number;
  metodoPago?: MetodoPago;
  tipoEstadia: TipoEstadia;
  cantidadHoras?: number;
  cantidadDias?: number;
  cantidad?: number;
  tarifaBaseHora?: number;
  tarifa?: ITarifaSnapshot;
  notas?: string;
  prepago?: boolean;
  detalleCobro?: string;
  tiempoTotal?: string;
  turnoId?: Types.ObjectId | string;
  billingDocumentId?: Types.ObjectId | string;
  billingDocumentCode?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const ClienteTicketSchema = new Schema<IClienteTicket>(
  {
    nombre: { type: String },
    apellido: { type: String },
    dni: { type: String },
    telefono: { type: String },
  },
  { _id: false }
);

const TarifaSnapshotSchema = new Schema<ITarifaSnapshot>(
  {
    _id: { type: Schema.Types.Mixed },
    nombre: { type: String },
    tarifaHora: { type: Number, default: 0 },
    tarifaDia: { type: Number, default: 0 },
    tarifaLibre: { type: Number, default: 0 },
    tarifaBaseHora: { type: Number, default: 0 },
    fraccionMinutos: { type: Number, default: 60 },
  },
  { _id: false }
);

const TicketSchema = new Schema<ITicket>(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    patente: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    categoria: {
      type: String,
      enum: ['Automóvil', 'Camioneta', 'Bicicleta', 'Motocicleta', 'Otros'],
      default: 'Automóvil',
    },
    cliente: ClienteTicketSchema,
    tarifaId: { type: Schema.Types.Mixed },
    operadorId: { type: Schema.Types.Mixed },
    horaEntrada: {
      type: Date,
      required: true,
      default: Date.now,
    },
    horaSalida: Date,
    estado: {
      type: String,
      enum: ['activa', 'cerrada'],
      default: 'activa',
    },
    totalCobrado: Number,
    metodoPago: {
      type: String,
      enum: ['efectivo', 'tarjeta', 'qr', 'otros'],
    },
    tipoEstadia: {
      type: String,
      enum: ['hora', 'dia', 'libre'],
      default: 'libre',
    },
    cantidadHoras: Number,
    cantidadDias: Number,
    cantidad: Number,
    tarifaBaseHora: Number,
    tarifa: TarifaSnapshotSchema,
    notas: String,
    prepago: Boolean,
    detalleCobro: String,
    tiempoTotal: String,
    turnoId: { type: Schema.Types.Mixed },
    billingDocumentId: { type: Schema.Types.Mixed, index: true },
    billingDocumentCode: { type: String, default: '' },
  },
  {
    timestamps: true,
    collection: 'tickets',
  }
);

const Ticket: Model<ITicket> =
  mongoose.models.Ticket || mongoose.model<ITicket>('Ticket', TicketSchema);

export default Ticket;
