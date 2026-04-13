import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/e-parking';
await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });

const UserSchema = new mongoose.Schema({ name: String, email: { type: String, unique: true }, password: String, role: String }, { timestamps: true });
const ParkingLotSchema = new mongoose.Schema({ owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, name: String, location: { lat: Number, lng: Number, address: String }, totalSpots: Number, availableSpots: Number, pricePerHour: Number, schedule: { open: String, close: String }, isAvailable: Boolean }, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const ParkingLot = mongoose.models.ParkingLot || mongoose.model('ParkingLot', ParkingLotSchema);

const ownerEmail = 'neomaxh2o@gmail.com';
const rawPassword = '435455';
const password = await bcrypt.hash(rawPassword, 10);

let owner = await User.findOne({ email: ownerEmail });
if (!owner) {
  owner = await User.create({ name: 'Neomax H2O', email: ownerEmail, password, role: 'owner' });
  if (process.env.DEBUG_PARKING === 'true') console.log(`created owner ${ownerEmail} [id=${owner._id}]`);
} else {
  if (process.env.DEBUG_PARKING === 'true') console.log(`found owner ${ownerEmail} [id=${owner._id}]`);
}

let parking = await ParkingLot.findOne({ owner: owner._id, name: 'QA Playa Centro' });
if (!parking) {
  parking = await ParkingLot.create({ owner: owner._id, name: 'QA Playa Centro', location: { lat: -34.6037, lng: -58.3816, address: 'QA Address 123' }, totalSpots: 120, availableSpots: 95, pricePerHour: 2500, schedule: { open: '00:00', close: '23:59' }, isAvailable: true });
  if (process.env.DEBUG_PARKING === 'true') console.log(`parking created: ${parking._id}`);
} else {
  if (process.env.DEBUG_PARKING === 'true') console.log(`parking exists: ${parking._id}`);
}

await mongoose.disconnect();
console.log('done');
