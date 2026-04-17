import { Schema, model, models, Document, Types } from 'mongoose';

// ------------------------
// Subdocumento Cliente
// ------------------------
export interface ICliente {
  nombre?: string;
  apellido?: string;
  dni?: string;
  telefono?: string;
}

// ------------------------
// Subdocumento Ticket
// ------------------------
export interface ITicket {
  ticketNumber: string;
  patente: string;
  categoria: 'Automóvil' | 'Motocicleta' | 'Camioneta' | 'Otros';
  cliente?: ICliente;
  tarifaId: Types.ObjectId;
  operadorId: Types.ObjectId;
  horaEntrada: Date;
  horaSalida?: Date;
  estado: 'activa' | 'cerrada';
  totalCobrado?: number;
  metodoPago?: 'efectivo' | 'tarjeta' | 'qr' | 'otros';
  tipoEstadia: 'hora' | 'dia' | 'libre';
  cantidadHoras?: number;
  cantidadDias?: number;
  tarifaBaseHora?: number;
  tarifa?: number;
  notas?: string;
  prepago?: boolean;
  detalleCobro?: string;
}

// ------------------------
// Subdocumento Liquidación
// ------------------------
export interface ILiquidacion {
  efectivo: number;
  tarjeta: number;
  otros: number;
  totalDeclarado: number;
  totalSistema?: number;
  diferencia?: number;
  tipoDiferencia?: 'sin_diferencia' | 'sobrante' | 'faltante';
  observacion?: string;
  fechaLiquidacion: Date;
}

// ------------------------
// Estados compatibles con flujo actual
// ------------------------
export type EstadoTurno =
  | 'abierto'
  | 'cerrado'
  | 'pendiente_liquidacion'
  | 'liquidado';

// ------------------------
// Modelo principal Turno
// ------------------------
export interface ITurno extends Document {
  operatorId: string;
  operatorName?: string;
  parkinglotId?: string;
  assignedParking?: string;
  fechaApertura: Date;
  fechaCierre?: Date;
  tickets: ITicket[];
  totalTurno: number;
  estado: EstadoTurno;
  liquidacion?: ILiquidacion;
  observaciones?: string;

  numeroCaja: number;
  esCajaAdministrativa?: boolean;

  cajaNumero?: number;
  numeroTurno?: number | null;
  subturnoNumero?: number;
  codigoTurno?: string;

  createdAt: Date;
  updatedAt: Date;
}

const ticketSchema = new Schema<ITicket>(
  {
    ticketNumber: { type: String, required: true },
    patente: { type: String, required: true, uppercase: true },
    categoria: {
      type: String,
      enum: ['Automóvil', 'Motocicleta', 'Camioneta', 'Otros'],
      required: true,
    },
    cliente: {
      nombre: String,
      apellido: String,
      dni: String,
      telefono: String,
    },
    tarifaId: { type: Schema.Types.ObjectId, ref: 'Tarifa', required: true },
    operadorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    horaEntrada: { type: Date, default: Date.now },
    horaSalida: Date,
    estado: { type: String, enum: ['activa', 'cerrada'], default: 'activa' },
    totalCobrado: Number,
    metodoPago: { type: String, enum: ['efectivo', 'tarjeta', 'qr', 'otros'] },
    tipoEstadia: { type: String, enum: ['hora', 'dia', 'libre'], required: true },

    cantidadHoras: {
      type: Number,
      default: 0,
      validate: {
        validator: function (this: ITicket, value: number) {
          if (this.tipoEstadia === 'hora') return value > 0;
          return true;
        },
        message: 'cantidadHoras debe ser mayor a 0 cuando el tipoEstadia es "hora"',
      },
    },
    cantidadDias: {
      type: Number,
      default: 0,
      validate: {
        validator: function (this: ITicket, value: number) {
          if (this.tipoEstadia === 'dia') return value > 0;
          return true;
        },
        message: 'cantidadDias debe ser mayor a 0 cuando el tipoEstadia es "dia"',
      },
    },

    tarifaBaseHora: Number,
    tarifa: Number,
    notas: String,
    prepago: { type: Boolean, default: false },
    detalleCobro: { type: String },
  },
  { _id: false }
);

const liquidacionSchema = new Schema<ILiquidacion>(
  {
    efectivo: { type: Number, required: true, default: 0 },
    tarjeta: { type: Number, required: true, default: 0 },
    otros: { type: Number, required: true, default: 0 },
    totalDeclarado: { type: Number, required: true, default: 0 },
    totalSistema: { type: Number, default: 0 },
    diferencia: { type: Number, default: 0 },
    tipoDiferencia: {
      type: String,
      enum: ['sin_diferencia', 'sobrante', 'faltante'],
      default: 'sin_diferencia',
    },
    observacion: { type: String, default: '' },
    fechaLiquidacion: { type: Date, default: Date.now },
  },
  { _id: false }
);

const turnoSchema = new Schema<ITurno>(
  {
    operatorId: { type: String, required: true, index: true },
    operatorName: { type: String, trim: true },
    parkinglotId: { type: String, default: null, index: true },
    assignedParking: { type: String, default: null, index: true },

    fechaApertura: { type: Date, default: Date.now },
    fechaCierre: { type: Date },

    tickets: { type: [ticketSchema], default: [] },
    totalTurno: { type: Number, default: 0 },

    estado: {
      type: String,
      enum: ['abierto', 'cerrado', 'pendiente_liquidacion', 'liquidado'],
      default: 'abierto',
      index: true,
    },

    observaciones: { type: String },
    liquidacion: { type: liquidacionSchema },

    numeroCaja: { type: Number, required: true, default: 1 },
    esCajaAdministrativa: { type: Boolean, default: false, index: true },

    cajaNumero: { type: Number, default: 1, index: true },
    numeroTurno: { type: Number, default: null },
    subturnoNumero: { type: Number, default: 0 },
    codigoTurno: { type: String, default: '' },
  },
  { timestamps: true }
);

turnoSchema.index(
  { numeroTurno: 1 },
  {
    unique: true,
    partialFilterExpression: {
      numeroTurno: { $type: 'number' },
    },
  }
);

turnoSchema.index(
  { codigoTurno: 1 },
  {
    unique: true,
    partialFilterExpression: {
      codigoTurno: { $type: 'string', $nin: [''] },
    },
  }
);

turnoSchema.index(
  { operatorId: 1, estado: 1 },
  {
    unique: true,
    partialFilterExpression: { estado: 'abierto' },
  }
);

const ExistingTurno = models.Turno as ReturnType<typeof model<ITurno>> | undefined;

if (ExistingTurno?.schema?.path('estado')) {
  const estadoPath = ExistingTurno.schema.path('estado') as unknown as {
    enumValues?: string[];
  };

  if (estadoPath?.enumValues && !estadoPath.enumValues.includes('pendiente_liquidacion')) {
    delete models.Turno;
  }
}

export default models.Turno || model<ITurno>('Turno', turnoSchema);
