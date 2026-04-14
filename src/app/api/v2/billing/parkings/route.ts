import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongoose';
import ParkingLot from '@/models/ParkingLot';
import User from '@/models/User';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  if (!['admin', 'owner', 'operator'].includes(session.user.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  await dbConnect();

  let parkings: Record<string, unknown>[] = [];

  if (session.user.role === 'owner') {
    parkings = await ParkingLot.find({ owner: session.user.id }).sort({ createdAt: -1 }).lean<Record<string, unknown>[]>();
  } else if (session.user.role === 'operator') {
    const operator = await User.findById(session.user.id).select('assignedParking').lean<Record<string, unknown> | null>();
    const assignedParkingIds = Array.isArray(operator?.assignedParking)
      ? operator.assignedParking
      : operator?.assignedParking
        ? [operator.assignedParking]
        : [];

    parkings = assignedParkingIds.length
      ? await ParkingLot.find({ _id: { $in: assignedParkingIds } }).sort({ createdAt: -1 }).lean<Record<string, unknown>[]>()
      : [];
  } else {
    parkings = await ParkingLot.find({}).sort({ createdAt: -1 }).lean<Record<string, unknown>[]>();
  }

  const normalized = parkings.map((parking) => ({
    _id: String(parking._id),
    name: String(parking.name ?? ''),
    owner: parking.owner ? String(parking.owner) : '',
    location: {
      lat: Number((parking.location as any)?.lat ?? 0),
      lng: Number((parking.location as any)?.lng ?? 0),
      address: String((parking.location as any)?.address ?? ''),
    },
    totalSpots: Number(parking.totalSpots ?? 0),
    availableSpots: Number(parking.availableSpots ?? 0),
    pricePerHour: Number(parking.pricePerHour ?? 0),
    schedule: {
      open: String((parking.schedule as any)?.open ?? ''),
      close: String((parking.schedule as any)?.close ?? ''),
    },
    isAvailable: Boolean(parking.isAvailable ?? true),
  }));

  return NextResponse.json(normalized, { status: 200 });
}
