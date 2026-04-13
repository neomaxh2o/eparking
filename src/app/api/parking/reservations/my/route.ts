import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/lib/mongoose';
import Reservation from '@/models/Reservation';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const session = await getServerSession(authOptions);
    const user = session?.user;

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (user.role !== 'client') {
      return NextResponse.json({ error: 'Solo los clientes pueden ver sus reservas' }, { status: 403 });
    }

    const reservations = await Reservation.find({ user: user.id })
      .populate('parkingLot') // trae los datos de la playa reservada
      .sort({ startTime: -1 });

    return NextResponse.json({ reservations }, { status: 200 });
  } catch (error) {
    console.error('[RESERVATION_MY]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
