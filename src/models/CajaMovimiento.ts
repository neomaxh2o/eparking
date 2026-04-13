import mongoose, { Schema, Document, model, models } from 'mongoose';

export interface ICajaMovimiento extends Document {
  parkinglotId?: mongoose.Types.ObjectId | null;
  cajaId?: mongoose.Types.ObjectId | null;
  cajaCode?: string;
  turnoId?: mongoose.Types.ObjectId | null;
  actorUserId?: mongoose.Types.ObjectId | null;
  actorRole?: 'admin' | 'owner' | 'operator' | 'system';
  sourceType: 'ticket' | 'abonado' | 'billing_document' | 'ajuste' | 'cierre';
  sourceId?: string;
  amount: number;
  paymentMethod?: string;
  paymentReference?: string;
  status?: string;
  snapshot?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const CajaMovimientoSchema = new Schema<ICajaMovimiento>(
  {
    parkinglotId: { type: Schema.Types.ObjectId, ref: 'ParkingLot', default: null, index: true },
    cajaId: { type: Schema.Types.ObjectId, ref: 'Caja', default: null, index: true },
    cajaCode: { type: String, default: '', index: true },
    turnoId: { type: Schema.Types.ObjectId, ref: 'Turno', default: null, index: true },
    actorUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    actorRole: { type: String, enum: ['admin', 'owner', 'operator', 'system'], default: 'system' },
    sourceType: { type: String, enum: ['ticket', 'abonado', 'billing_document', 'ajuste', 'cierre'], required: true, index: true },
    sourceId: { type: String, default: '', index: true },
    amount: { type: Number, required: true, default: 0 },
    paymentMethod: { type: String, default: '' },
    paymentReference: { type: String, default: '' },
    status: { type: String, default: 'registrado', index: true },
    snapshot: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

CajaMovimientoSchema.index({ cajaId: 1, createdAt: -1 });
CajaMovimientoSchema.index({ turnoId: 1, createdAt: -1 });

export default models.CajaMovimiento || model<ICajaMovimiento>('CajaMovimiento', CajaMovimientoSchema);
