import mongoose, { Schema, Document, model, models } from 'mongoose';

export interface ICaja extends Document {
  parkinglotId: mongoose.Types.ObjectId;
  parkingCode: string;
  numero: number;
  code: string;
  displayName: string;
  tipo: 'operativa' | 'administrativa' | 'mixta';
  activa: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CajaSchema = new Schema<ICaja>(
  {
    parkinglotId: { type: Schema.Types.ObjectId, ref: 'ParkingLot', required: true, index: true },
    parkingCode: { type: String, required: true, index: true },
    numero: { type: Number, required: true },
    code: { type: String, required: true, unique: true, index: true },
    displayName: { type: String, required: true },
    tipo: { type: String, enum: ['operativa', 'administrativa', 'mixta'], default: 'operativa' },
    activa: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

CajaSchema.index({ parkinglotId: 1, numero: 1 }, { unique: true });

export default models.Caja || model<ICaja>('Caja', CajaSchema);
