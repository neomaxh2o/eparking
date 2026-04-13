import { Schema, model, models, Document } from 'mongoose';

export interface ITurnoReport extends Document {
  turnoId: string;
  parkinglotId?: string;
  operatorId?: string;
  operatorName?: string;
  numeroCaja?: number;
  estado?: string;
  codigoTurno?: string;
  fechaApertura?: Date;
  fechaCierreOperativo?: Date;
  fechaLiquidacion?: Date;
  fechaCierre?: Date;
  html: string;
  createdAt: Date;
  updatedAt: Date;
}

const turnoReportSchema = new Schema<ITurnoReport>(
  {
    turnoId: { type: String, required: true, index: true },
    parkinglotId: { type: String, default: '', index: true },
    operatorId: { type: String, default: '' },
    operatorName: { type: String, default: '' },
    numeroCaja: { type: Number, default: 1 },
    estado: { type: String, default: '' },
    codigoTurno: { type: String, default: '' },
    fechaApertura: { type: Date },
    fechaCierreOperativo: { type: Date },
    fechaLiquidacion: { type: Date },
    fechaCierre: { type: Date },
    html: { type: String, required: true },
  },
  { timestamps: true },
);

turnoReportSchema.index({ createdAt: -1 });
turnoReportSchema.index({ codigoTurno: 1 });

export default models.TurnoReport || model<ITurnoReport>('TurnoReport', turnoReportSchema);
