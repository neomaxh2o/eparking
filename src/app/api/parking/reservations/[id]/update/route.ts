import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/lib/mongoose';
import Reservation from '@/models/Reservation';
import ParkingLot from '@/models/ParkingLot';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  return handleUpdate(req, id);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  return handleUpdate(req, id);
}

async function handleUpdate(req: NextRequest, id: string) {
  try {
    await connectToDatabase();

    const session = await getServerSession(authOptions);
    const user = session?.user;

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo admin, owner u operator pueden actualizar
    if (!['admin', 'owner', 'operator'].includes(user.role)) {
      return NextResponse.json({ error: 'No tiene permisos para actualizar reservas' }, { status: 403 });
    }

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
    }

    // Validación extra para owner: solo puede modificar reservas de su playa
    if (user.role === 'owner') {
      const parkingLot = await ParkingLot.findById(reservation.parkingLot);
      if (!parkingLot || parkingLot.owner.toString() !== user.id) {
        return NextResponse.json({ error: 'No autorizado para modificar esta reserva' }, { status: 403 });
      }
    }

    const { status, amountPaid } = await req.json();

    const allowedStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (status && !allowedStatuses.includes(status)) {
      return NextResponse.json({ error: 'Estado no válido' }, { status: 400 });
    }

    if (status) reservation.status = status;
    if (amountPaid !== undefined) reservation.amountPaid = amountPaid;

    // Guardamos el id del usuario que procesa la reserva
    reservation.processedBy = user.id;

    await reservation.save();

    return NextResponse.json({ reservation }, { status: 200 });
  } catch (error) {
    console.error('[RESERVATION_UPDATE]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
