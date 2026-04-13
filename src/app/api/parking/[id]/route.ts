import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import ParkingLot from '@/models/ParkingLot';

export async function PATCH(req: NextRequest, context: { params: { id: string } }) {
try {
const { id } = context.params;
const { isAvailable } = await req.json();

if (typeof isAvailable !== 'boolean') {
return NextResponse.json({ error: 'isAvailable must be boolean' }, { status: 400 });
}

await connectToDatabase();

const parking = await ParkingLot.findByIdAndUpdate(
id,
{ isAvailable },
{ new: true }
);

if (!parking) {
return NextResponse.json({ error: 'Parking not found' }, { status: 404 });
}

return NextResponse.json({
message: 'Availability updated',
parking: {
id: String(parking._id),
name: parking.name,
isAvailable: parking.isAvailable,
},
});
} catch (error) {
console.error('Error PATCH /api/parking/[id]:', error);
return NextResponse.json({ error: 'Server error' }, { status: 500 });
}
}
