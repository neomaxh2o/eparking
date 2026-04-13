import mongoose, { Schema, Document, model, models } from 'mongoose';
import { debug as debugLogger } from '@/lib/debugLogger';

export interface IParking extends Document {
  name: string;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  geo: {
    type: 'Point';
    coordinates: [number, number];
  };
  totalSpots: number;
  availableSpots: number;
  pricePerHour: number;
  schedule: {
    open: string;
    close: string;
  };
  owner: string | { _id: string; name?: string };
  isAvailable: boolean;
}

const ParkingSchema = new Schema<IParking>({
  name: { type: String, required: true },
  location: {
    address: { type: String },
    lat: { type: Number },
    lng: { type: Number },
  },
  geo: {
    type: { type: String, enum: ['Point'], required: true, default: 'Point' },
    coordinates: { type: [Number], required: true },
  },
  totalSpots: Number,
  availableSpots: Number,
  pricePerHour: Number,
  schedule: { open: String, close: String },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  isAvailable: { type: Boolean, default: true },
});

ParkingSchema.index({ geo: '2dsphere' });

ParkingSchema.pre('save', function (next) {
  if (this.location?.lat != null && this.location?.lng != null) {
    this.geo = { type: 'Point', coordinates: [this.location.lng, this.location.lat] };
  }
  if (process.env.DEBUG_PARKING === 'true') {
    try { debugLogger('parking.pre.save', { id: this._id }); } catch(e){}
  }
  next();
});

ParkingSchema.post('save', function(doc) {
  if (process.env.DEBUG_PARKING === 'true') {
    try { debugLogger('parking.post.save', { id: doc._id }); } catch(e){}
  }
});

export default models.Parking || model<IParking>('Parking', ParkingSchema);
