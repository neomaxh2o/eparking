import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongoose';
import ParkingLot from '@/models/ParkingLot';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/e-parking';
await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });

const ids = ['69dc84a5d9a014acc4f923c2','69dc8566d9a014acc4f923c4'];
for (const id of ids) {
  try {
    const res = await ParkingLot.findByIdAndDelete(id);
    if (res) console.log(`Deleted parking ${id} -> ${res.name}`);
    else console.log(`Parking ${id} not found`);
  } catch (e) {
    console.log(`Error deleting ${id}:`, e.message);
  }
}

await mongoose.disconnect();
console.log('done');
