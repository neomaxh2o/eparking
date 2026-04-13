import mongoose, { Schema, Document, model, models } from 'mongoose';
import { debug as debugLogger } from '@/lib/debugLogger';

export interface IParkingLot extends Document {
  owner: mongoose.Types.ObjectId;
  name: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  totalSpots: number;
  availableSpots: number;
  pricePerHour: number;
  schedule: {
    open: string;
    close: string;
  };
  isAvailable: boolean;
  billingProfile?: {
    enabled?: boolean;
    businessName?: string;
    taxCondition?: 'responsable_inscripto' | 'monotributo' | 'exento' | 'consumidor_final' | 'no_categorizado';
    documentType?: 'dni' | 'cuit' | 'otro';
    documentNumber?: string;
    pointOfSale?: string;
    voucherTypeDefault?: 'factura_a' | 'factura_b' | 'factura_c' | 'consumidor_final';
    iibb?: string;
    address?: string;
    city?: string;
    email?: string;
    phone?: string;
  };
}

const ParkingLotSchema: Schema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      address: { type: String, required: true },
    },
    totalSpots: { type: Number, required: true },
    availableSpots: { type: Number, required: true },
    pricePerHour: { type: Number, required: true },
    schedule: {
      open: { type: String, required: true },
      close: { type: String, required: true },
    },
    isAvailable: { type: Boolean, default: true },
    billingProfile: {
      enabled: { type: Boolean, default: false },
      businessName: { type: String, default: '' },
      taxCondition: { type: String, enum: ['responsable_inscripto', 'monotributo', 'exento', 'consumidor_final', 'no_categorizado'], default: 'consumidor_final' },
      documentType: { type: String, enum: ['dni', 'cuit', 'otro'], default: 'cuit' },
      documentNumber: { type: String, default: '' },
      pointOfSale: { type: String, default: '' },
      voucherTypeDefault: { type: String, enum: ['factura_a', 'factura_b', 'factura_c', 'consumidor_final'], default: 'consumidor_final' },
      iibb: { type: String, default: '' },
      address: { type: String, default: '' },
      city: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

// Debug hooks: log ids when DEBUG_PARKING=true
ParkingLotSchema.pre('save', function(next) {
  if (process.env.DEBUG_PARKING === 'true') {
    try { debugLogger('parkinglot.pre.save', { id: this._id }); } catch(e){}
  }
  next();
});
ParkingLotSchema.post('save', function(doc) {
  if (process.env.DEBUG_PARKING === 'true') {
    try { debugLogger('parkinglot.post.save', { id: doc._id }); } catch(e){}
  }
});

const ParkingLot = (models.ParkingLot as mongoose.Model<IParkingLot>) || model<IParkingLot>('ParkingLot', ParkingLotSchema);
export default ParkingLot;
