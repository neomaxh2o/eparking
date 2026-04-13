import { Schema, model, models } from 'mongoose';

const closureSchema = new Schema(
  {
    turnoId: { type: Schema.Types.ObjectId, ref: 'Turno', required: true, index: true },
    parkinglotId: { type: Schema.Types.ObjectId, ref: 'ParkingLot', index: true },
    cajaId: { type: Schema.Types.ObjectId, ref: 'Caja', index: true },
    ownerId: { type: String, index: true },
    operatorId: { type: String, index: true },
    fechaLiquidacion: { type: Date, default: Date.now, index: true },
    totals: {
      efectivo: { type: Number, default: 0 },
      tarjeta: { type: Number, default: 0 },
      qr: { type: Number, default: 0 },
      otros: { type: Number, default: 0 },
      totalSistema: { type: Number, default: 0 },
      totalDeclarado: { type: Number, default: 0 },
      diferencia: { type: Number, default: 0 },
      tipoDiferencia: { type: String, enum: ['sin_diferencia', 'sobrante', 'faltante'], default: 'sin_diferencia' },
    },
    reportUrl: { type: String, default: '' },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export default models.Closure || model('Closure', closureSchema);
