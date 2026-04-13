import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import ParkingLot from '@/models/ParkingLot';

export async function GET() {
try {
await connectToDatabase();

const parkings = await ParkingLot.find()
.sort({ createdAt: -1 })
.populate('owner', 'name email')
.lean();

const normalized = parkings.map((parking: Record<string, unknown>) => ({
id: String(parking._id),
name: String(parking.name ?? ''),
owner: parking.owner,
location: parking.location,
totalSpots: parking.totalSpots,
availableSpots: parking.availableSpots,
pricePerHour: parking.pricePerHour,
schedule: parking.schedule,
isAvailable: parking.isAvailable,
}));

return NextResponse.json({ parkings: normalized });
} catch (error) {
console.error('Error en GET /api/parking/all:', error);
return NextResponse.json({ error: 'Error interno' }, { status: 500 });
}
}
