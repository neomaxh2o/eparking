import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import ParkingLot from '@/models/ParkingLot';

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const raw: unknown = await req.json().catch(() => null);
    const body = (raw && typeof raw === 'object') ? (raw as Record<string, unknown>) : {};
    const isAvailable = body.isAvailable as boolean | undefined;

    if (typeof isAvailable !== 'boolean') {
      return NextResponse.json({ error: 'isAvailable must be boolean' }, { status: 400 });
    }

    await connectToDatabase();

    const parking = await ParkingLot.findByIdAndUpdate(id, { isAvailable }, { new: true }).lean<Record<string, unknown> | null>();

    if (!parking) {
      return NextResponse.json({ error: 'Parking not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Availability updated',
      parking: {
        id: String(parking._id),
        name: String(parking.name ?? ''),
        isAvailable: Boolean(parking.isAvailable ?? false),
      },
    });
  } catch (error: unknown) {
    console.error('Error PATCH /api/parking/[id]:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
