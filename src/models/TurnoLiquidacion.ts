import { Schema, model, models, Document } from 'mongoose';

export interface ITurnoLiquidacion extends Document {
  turnoId: string;
  parkinglotId?: string | null;
  cajaId?: string | null;
  cajaNumero?: number | null;
  codigoTurno?: string;
  operadorAperturaId?: string | null;
  operadorCierreId?: string | null;
  liquidadoPor?: string | null;
  fechaApertura?: Date | null;
  fechaCierre?: Date | null;
  cantidadTickets: number;
  cantidadOperaciones: number;
  totalEfectivo: number;
  totalTransferencia: number;
  totalTarjeta: number;
  totalOtros: number;
  totalIngresos: number;
  totalEgresos: number;
  saldoTeorico: number;
  saldoDeclarado?: number | null;
  diferenciaCaja?: number | null;
  observaciones?: string;
  snapshot: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const turnoLiquidacionSchema = new Schema<ITurnoLiquidacion>(
  {
    turnoId: { type: String, required: true, unique: true, index: true },
    parkinglotId: { type: String, default: null, index: true },
    cajaId: { type: String, default: null, index: true },
    cajaNumero: { type: Number, default: null },
    codigoTurno: { type: String, default: '', index: true },
    operadorAperturaId: { type: String, default: null, index: true },
    operadorCierreId: { type: String, default: null, index: true },
    liquidadoPor: { type: String, default: null, index: true },
    fechaApertura: { type: Date, default: null },
    fechaCierre: { type: Date, default: null },
    cantidadTickets: { type: Number, required: true, default: 0 },
    cantidadOperaciones: { type: Number, required: true, default: 0 },
    totalEfectivo: { type: Number, required: true, default: 0 },
    totalTransferencia: { type: Number, required: true, default: 0 },
    totalTarjeta: { type: Number, required: true, default: 0 },
    totalOtros: { type: Number, required: true, default: 0 },
    totalIngresos: { type: Number, required: true, default: 0 },
    totalEgresos: { type: Number, required: true, default: 0 },
    saldoTeorico: { type: Number, required: true, default: 0 },
    saldoDeclarado: { type: Number, default: null },
    diferenciaCaja: { type: Number, default: null },
    observaciones: { type: String, default: '' },
    snapshot: { type: Schema.Types.Mixed, required: true, default: {} },
  },
  { timestamps: true }
);

turnoLiquidacionSchema.index({ fechaCierre: -1 });
turnoLiquidacionSchema.index({ parkinglotId: 1, fechaCierre: -1 });
turnoLiquidacionSchema.index({ operadorAperturaId: 1, fechaCierre: -1 });

export default models.TurnoLiquidacion || model<ITurnoLiquidacion>('TurnoLiquidacion', turnoLiquidacionSchema);
