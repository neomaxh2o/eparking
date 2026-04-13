import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/lib/mongoose';
import ParkingLot from '@/models/ParkingLot';
import User from '@/models/User';

export async function GET(_req: NextRequest) {
  try {
    await connectToDatabase();

    const session = await getServerSession(authOptions);
    const user = session?.user;

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    let result: Record<string, any>[] = [];

    switch (user.role) {
      case 'owner':
        result = await ParkingLot.find({ owner: user.id }).sort({ createdAt: -1 }).lean();
        break;

      case 'admin':
        result = await ParkingLot.find({})
          .sort({ createdAt: -1 })
          .populate('owner', 'name email')
          .lean();
        break;

      case 'operator': {
        const operatorData = await User.findById(user.id).select('assignedParking');
        if (!operatorData?.assignedParking) {
          return NextResponse.json({ error: 'No tienes una playa asignada' }, { status: 403 });
        }

        const assignedParkingIds = Array.isArray(operatorData.assignedParking)
          ? operatorData.assignedParking
          : [operatorData.assignedParking];

        result = await ParkingLot.find({ _id: { $in: assignedParkingIds } })
          .sort({ createdAt: -1 })
          .lean();
        break;
      }

      case 'client':
        result = await ParkingLot.find({}).sort({ createdAt: -1 }).lean();
        break;

      default:
        return NextResponse.json({ error: 'Rol no autorizado' }, { status: 403 });
    }

    const normalized = result.map((parking) => ({
      _id: String(parking._id),
      name: String(parking.name ?? ''),
      owner:
        typeof parking.owner === 'object' && parking.owner !== null && '_id' in parking.owner
          ? String((parking.owner as any)._id)
          : parking.owner
          ? String(parking.owner)
          : '',
      location: parking.location ?? {
        lat: 0,
        lng: 0,
        address: '',
      },
      totalSpots: Number(parking.totalSpots ?? 0),
      availableSpots: Number(parking.availableSpots ?? 0),
      pricePerHour: Number(parking.pricePerHour ?? 0),
      schedule: parking.schedule ?? {
        open: '',
        close: '',
      },
      isAvailable: Boolean(parking.isAvailable ?? true),
      createdAt: parking.createdAt ?? null,
      updatedAt: parking.updatedAt ?? null,
    }));

    return NextResponse.json({ parkings: normalized });
  } catch (error) {
    console.error('[PARKING_LIST]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
