import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import ParkingLot from '@/models/ParkingLot';

export async function GET(request: NextRequest) {
try {
await connectToDatabase();

const url = new URL(request.url);
const includeOwner = url.searchParams.get('includeOwner') === 'true';

let query = ParkingLot.find().sort({ createdAt: -1 });

if (includeOwner) {
query = query.populate('owner', 'name email');
}

const parkings = await query.lean();

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

return NextResponse.json(normalized);
} catch (error) {
console.error('Error en GET /api/parking:', error);
return NextResponse.json({ error: 'Error interno' }, { status: 500 });
}
}
