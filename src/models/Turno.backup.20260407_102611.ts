import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export type EstadoTurno = 'abierto' | 'cerrado';

export interface ILiquidacionTurno {
  efectivo: number;
  tarjeta: number;
  otros: number;
  totalDeclarado: number;
  fechaLiquidacion: Date;
}

export interface ITurno extends Document {
  operatorId: Types.ObjectId | string;
  numeroCaja: number;
  fechaApertura: Date;
  fechaCierre?: Date;
  estado: EstadoTurno;
  totalTurno: number;
  observaciones?: string;
  liquidacion?: ILiquidacionTurno;
  createdAt?: Date;
  updatedAt?: Date;
}

const LiquidacionTurnoSchema = new Schema<ILiquidacionTurno>(
  {
    efectivo: { type: Number, default: 0 },
    tarjeta: { type: Number, default: 0 },
    otros: { type: Number, default: 0 },
    totalDeclarado: { type: Number, default: 0 },
    fechaLiquidacion: { type: Date, required: true },
  },
  { _id: false }
);

const TurnoSchema = new Schema<ITurno>(
  {
    operatorId: {
      type: Schema.Types.Mixed,
      required: true,
      index: true,
    },
    numeroCaja: {
      type: Number,
      required: true,
      default: 1,
    },
    fechaApertura: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    fechaCierre: {
      type: Date,
      required: false,
    },
    estado: {
      type: String,
      enum: ['abierto', 'cerrado'],
      required: true,
      default: 'abierto',
      index: true,
    },
    totalTurno: {
      type: Number,
      required: true,
      default: 0,
    },
    observaciones: {
      type: String,
      required: false,
      trim: true,
    },
    liquidacion: {
      type: LiquidacionTurnoSchema,
      required: false,
    },
  },
  {
    timestamps: true,
    collection: 'turnos',
  }
);

TurnoSchema.index(
  { operatorId: 1, estado: 1 },
  { partialFilterExpression: { estado: 'abierto' } }
);

const Turno: Model<ITurno> =
  mongoose.models.Turno || mongoose.model<ITurno>('Turno', TurnoSchema);

export default Turno;
