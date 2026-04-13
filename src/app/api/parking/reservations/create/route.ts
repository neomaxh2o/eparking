import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/lib/mongoose';
import Reservation from '@/models/Reservation';
import ParkingLot from '@/models/ParkingLot';

export async function POST(req: NextRequest) {
  try {
    console.log('[RESERVATION_CREATE] Inicio del proceso');
    
    await connectToDatabase();
    console.log('[RESERVATION_CREATE] DB conectada');

    const session = await getServerSession(authOptions);
    console.log('[RESERVATION_CREATE] Sesión obtenida:', session);

    const user = session?.user;

    if (!user) {
      console.log('[RESERVATION_CREATE] No autorizado - Sin usuario');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // ✅ Permitir solo client y operator
    if (user.role !== 'client' && user.role !== 'operator') {
      console.log('[RESERVATION_CREATE] Usuario sin permiso:', user.role);
      return NextResponse.json({ error: 'No tienes permisos para crear reservas' }, { status: 403 });
    }

    const body = await req.json();
    console.log('[RESERVATION_CREATE] Body recibido:', body);

    const {
      parkingLot,
      nombre,
      apellido,
      dni,
      telefono,
      ciudad,
      patenteVehiculo,
      modeloVehiculo,
      categoriaVehiculo,
      domicilio,
      formaPago,
      cantidadDias,
      startTime,
      endTime,
      amountPaid,
    } = body;

    // Validación de campos obligatorios
    if (
      !parkingLot ||
      !nombre ||
      !apellido ||
      !dni ||
      !telefono ||
      !ciudad ||
      !patenteVehiculo ||
      !modeloVehiculo ||
      !categoriaVehiculo ||
      !domicilio ||
      !formaPago ||
      !cantidadDias ||
      !startTime ||
      !endTime
    ) {
      console.log('[RESERVATION_CREATE] Faltan campos obligatorios');
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const allowedCategories = ['Automóvil', 'Camioneta', 'Bicicleta', 'Motocicleta', 'Otros'];
    if (!allowedCategories.includes(categoriaVehiculo)) {
      console.log('[RESERVATION_CREATE] Categoría de vehículo inválida:', categoriaVehiculo);
      return NextResponse.json({ error: 'Categoría de vehículo inválida' }, { status: 400 });
    }

    const lotExists = await ParkingLot.findById(parkingLot);
    console.log('[RESERVATION_CREATE] Playa encontrada:', !!lotExists);
    if (!lotExists) {
      return NextResponse.json({ error: 'Playa no encontrada' }, { status: 404 });
    }

    const reservation = await Reservation.create({
      user: user.id,
      parkingLot,
      nombre,
      apellido,
      dni,
      telefono,
      ciudad,
      patenteVehiculo,
      modeloVehiculo,
      categoriaVehiculo,
      domicilio,
      formaPago,
      cantidadDias,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      amountPaid: amountPaid ?? 0,
    });
    console.log('[RESERVATION_CREATE] Reserva creada:', reservation);

    return NextResponse.json({ reservation }, { status: 201 });
  } catch (error) {
    console.error('[RESERVATION_CREATE] Error capturado:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
