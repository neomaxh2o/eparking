import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/lib/mongoose';
import Reservation from '@/models/Reservation';
import ParkingLot from '@/models/ParkingLot';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();

    const session = await getServerSession(authOptions);
    const user = session?.user;
    const reservationId = params.id;

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (user.role !== 'admin' && user.role !== 'owner') {
      return NextResponse.json({ error: 'No tiene permisos para eliminar reservas' }, { status: 403 });
    }

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
    }

    if (user.role === 'owner') {
      const parkingLot = await ParkingLot.findById(reservation.parkingLot);
      if (!parkingLot || parkingLot.ownerId.toString() !== user.id) {
        return NextResponse.json({ error: 'No autorizado para eliminar esta reserva' }, { status: 403 });
      }
    }

    await reservation.deleteOne();

    return NextResponse.json({ message: 'Reserva eliminada correctamente' }, { status: 200 });
  } catch (error) {
    console.error('[RESERVATION_DELETE]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
