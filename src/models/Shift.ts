import mongoose from 'mongoose';

const { Schema } = mongoose;

const ShiftSchema = new Schema({
  storeId: { type: Schema.Types.ObjectId, required: true, index: true },
  openedBy: { type: Schema.Types.ObjectId, required: true },
  openedAt: { type: Date, required: true, default: Date.now },
  closedBy: { type: Schema.Types.ObjectId, default: null },
  closedAt: { type: Date, default: null },
  status: { type: String, enum: ['open', 'closed', 'suspended'], required: true, default: 'open' },
  startingCash: { type: Number, required: true, min: 0 },
  expectedCash: { type: Number, required: true, default: 0 },
  actualCash: { type: Number, default: null },
  ticketsCount: { type: Number, default: 0 },
  ticketsTotal: { type: Number, default: 0 },
  cashMovementsTotal: { type: Number, default: 0 },
  notes: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.models.Shift || mongoose.model('Shift', ShiftSchema, 'shifts');
