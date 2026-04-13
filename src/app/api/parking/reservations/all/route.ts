import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/lib/mongoose';
import Reservation from '@/models/Reservation';
import ParkingLot from '@/models/ParkingLot';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const session = await getServerSession(authOptions);
    const user = session?.user;

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    let reservations;

    if (user.role === 'admin') {
      // Admin ve todas las reservas
      reservations = await Reservation.find()
        .populate('user', 'name email')
        .populate('parkingLot')
        .sort({ createdAt: -1 });

    } else if (user.role === 'owner') {
      // Owner ve reservas de sus playas
      const ownedLots = await ParkingLot.find({ owner: user.id }).select('_id');
      const ownedLotIds = ownedLots.map(lot => lot._id);

      reservations = await Reservation.find({ parkingLot: { $in: ownedLotIds } })
        .populate('user', 'name email')
        .populate('parkingLot')
        .sort({ createdAt: -1 });

    } else if (user.role === 'operator') {
      // Operator ve reservas de la playa asignada
      const operatorData = await User.findById(user.id).select('assignedParking');
      if (!operatorData?.assignedParking) {
        return NextResponse.json({ error: 'No tienes una playa asignada' }, { status: 403 });
      }

      reservations = await Reservation.find({ parkingLot: operatorData.assignedParking })
        .populate('user', 'name email')
        .populate('parkingLot')
        .sort({ createdAt: -1 });

    } else if (user.role === 'client') {
      // Cliente ve sus propias reservas
      reservations = await Reservation.find({ user: user.id })
        .populate('user', 'name email')
        .populate('parkingLot')
        .sort({ createdAt: -1 });

    } else {
      return NextResponse.json({ error: 'No autorizado para ver reservas' }, { status: 403 });
    }

    return NextResponse.json({ reservations }, { status: 200 });
  } catch (error) {
    console.error('[RESERVATION_ALL]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
