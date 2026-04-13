import mongoose, { Schema, Document } from 'mongoose';

export interface IBillingClosure extends Document {
  type: 'turno' | 'caja' | 'zeta' | 'periodo';
  status: 'open' | 'closed' | 'posted';
  actorRole?: 'admin' | 'owner' | 'operator' | 'system';
  actorUserId?: mongoose.Types.ObjectId | null;
  ownerId?: mongoose.Types.ObjectId | null;
  assignedParking?: mongoose.Types.ObjectId | null;
  turnoId?: mongoose.Types.ObjectId | null;
  cajaNumero?: number | null;
  from?: Date | null;
  to?: Date | null;
  totals: {
    efectivo: number;
    tarjeta: number;
    qr: number;
    otros: number;
    total: number;
    documentsCount: number;
    documentsByType: Record<string, number>;
  };
  linkedDocumentIds?: mongoose.Types.ObjectId[];
}

const BillingClosureSchema = new Schema<IBillingClosure>(
  {
    type: { type: String, enum: ['turno', 'caja', 'zeta', 'periodo'], required: true, index: true },
    status: { type: String, enum: ['open', 'closed', 'posted'], default: 'closed' },
    actorRole: { type: String, enum: ['admin', 'owner', 'operator', 'system'], default: 'system' },
    actorUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    assignedParking: { type: Schema.Types.ObjectId, ref: 'ParkingLot', default: null, index: true },
    turnoId: { type: Schema.Types.ObjectId, ref: 'Turno', default: null },
    cajaNumero: { type: Number, default: null, index: true },
    from: { type: Date, default: null },
    to: { type: Date, default: null },
    totals: {
      efectivo: { type: Number, default: 0 },
      tarjeta: { type: Number, default: 0 },
      qr: { type: Number, default: 0 },
      otros: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      documentsCount: { type: Number, default: 0 },
      documentsByType: { type: Schema.Types.Mixed, default: {} },
    },
    linkedDocumentIds: { type: [Schema.Types.ObjectId], ref: 'AbonadoInvoice', default: [] },
  },
  { timestamps: true },
);

export default mongoose.models.BillingClosure || mongoose.model<IBillingClosure>('BillingClosure', BillingClosureSchema);
