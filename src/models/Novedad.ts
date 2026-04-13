import mongoose, { Schema, Document, model, models } from 'mongoose';

export interface INovedad extends Document {
  title: string;
  description: string;
  author?: string;
  category?: string;
  date: Date;
  parkingId?: mongoose.Types.ObjectId;
  recipients?: mongoose.Types.ObjectId[];
  recipientParkings?: mongoose.Types.ObjectId[];
  isGlobal?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NovedadSchema = new Schema<INovedad>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    author: { type: String, default: 'Anon' },
    category: { type: String, default: 'general' },
    date: { type: Date, default: () => new Date() },
    parkingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Parking', required: false },
    recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    recipientParkings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Parking' }],
    isGlobal: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: 'novedades',
  }
);

export const Novedad = models.Novedad || model<INovedad>('Novedad', NovedadSchema);
