import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongoose';
import Turno from '@/models/Turno';
import ParkingLot from '@/models/ParkingLot';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  if (!['admin', 'owner'].includes(session.user.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  await dbConnect();
  const { searchParams } = new URL(req.url);
  const parkinglotId = searchParams.get('parkinglotId');

  const query: Record<string, unknown> = {
    operatorId: session.user.id,
    estado: 'abierto',
    esCajaAdministrativa: true,
  };

  if (parkinglotId) query.assignedParking = parkinglotId;

  const turno = await Turno.findOne(query).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ turno: turno ?? null }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  if (!['admin', 'owner'].includes(session.user.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  await dbConnect();
  const body = await req.json().catch(() => ({}));
  const parkinglotId = body?.parkinglotId ? String(body.parkinglotId) : null;
  const cajaNumero = Number(body?.cajaNumero ?? 0);

  if (!parkinglotId) {
    return NextResponse.json({ error: 'parkinglotId es requerido' }, { status: 400 });
  }

  if (!Number.isFinite(cajaNumero) || cajaNumero <= 0) {
    return NextResponse.json({ error: 'cajaNumero es requerido' }, { status: 400 });
  }

  // Enforce scope: owner -> only owned parkings, operator -> only assigned parkings. admin -> any
  let allowedParkingIds: string[] | null = null;
  if (session.user.role === 'owner') {
    const ownedParkings = await ParkingLot.find({ owner: session.user.id }).select('_id').lean();
    allowedParkingIds = ownedParkings.map((p) => String((p as any)._id));
  } else if (session.user.role === 'operator') {
    const operator = await User.findById(session.user.id).select('assignedParking').lean();
    const assigned = Array.isArray((operator as any)?.assignedParking)
      ? (operator as any).assignedParking
      : (operator as any)?.assignedParking
        ? [(operator as any).assignedParking]
        : [];
    allowedParkingIds = assigned.map((id: any) => String(id));
  }

  if (allowedParkingIds && !allowedParkingIds.includes(parkinglotId)) {
    return NextResponse.json({ error: 'La playa indicada no pertenece al alcance del usuario logueado.' }, { status: 403 });
  }

  const existing = await Turno.findOne({
    operatorId: session.user.id,
    estado: 'abierto',
    esCajaAdministrativa: true,
  }).lean();

  if (existing) {
    return NextResponse.json({ error: 'Ya existe una caja administrativa abierta para este usuario.', turno: existing }, { status: 409 });
  }

  const turno = await Turno.create({
    operatorId: session.user.id,
    assignedParking: parkinglotId,
    numeroCaja: cajaNumero,
    cajaNumero,
    estado: 'abierto',
    esCajaAdministrativa: true,
    observaciones: 'Caja administrativa abierta desde Facturación',
    fechaApertura: new Date(),
  });

  return NextResponse.json({ ok: true, turno }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  if (!['admin', 'owner'].includes(session.user.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  await dbConnect();
  const body = await req.json().catch(() => ({}));
  const turnoId = body?.turnoId ? String(body.turnoId) : null;

  if (!turnoId) {
    return NextResponse.json({ error: 'turnoId es requerido' }, { status: 400 });
  }

  const turno = await Turno.findOneAndUpdate(
    {
      _id: turnoId,
      operatorId: session.user.id,
      estado: 'abierto',
      esCajaAdministrativa: true,
    },
    {
      $set: {
        estado: 'cerrado',
        fechaCierre: new Date(),
      },
    },
    { new: true },
  );

  if (!turno) {
    return NextResponse.json({ error: 'Caja administrativa no encontrada o ya cerrada.' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, turno }, { status: 200 });
}
