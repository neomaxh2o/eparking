import mongoose from 'mongoose';

const { Schema } = mongoose;

const CashMovementSchema = new Schema({
  shiftId: { type: Schema.Types.ObjectId, default: null },
  storeId: { type: Schema.Types.ObjectId, required: true },
  createdBy: { type: Schema.Types.ObjectId, required: true },
  createdAt: { type: Date, required: true, default: Date.now },
  type: { type: String, enum: ['in', 'out', 'adjustment'], required: true },
  amount: { type: Number, required: true, min: 1 },
  direction: { type: String, enum: ['in', 'out'], required: true },
  reason: { type: String, default: '' },
  reference: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.models.CashMovement || mongoose.model('CashMovement', CashMovementSchema, 'cashmovements');
