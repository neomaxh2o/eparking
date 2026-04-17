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

  if (parkinglotId) {
    query.$or = [
      { parkinglotId },
      { assignedParking: parkinglotId },
    ];
  }

  const turno = await Turno.findOne(query).sort({ createdAt: -1 }).lean<Record<string, unknown> | null>();
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
  const body: unknown = await req.json().catch(() => null);
  const b = (body && typeof body === 'object') ? (body as Record<string, unknown>) : {};
  const parkinglotId = b?.parkinglotId ? String(b.parkinglotId) : null;
  const cajaNumero = Number(b?.cajaNumero ?? 1);

  if (!parkinglotId) {
    return NextResponse.json({ error: 'parkinglotId es requerido' }, { status: 400 });
  }

  if (!Number.isFinite(cajaNumero) || cajaNumero <= 0) {
    return NextResponse.json({ error: 'cajaNumero es requerido' }, { status: 400 });
  }

  // Enforce scope: owner -> only owned parkings, operator -> only assigned parkings. admin -> any
  let allowedParkingIds: string[] | null = null;
  if (session.user.role === 'owner') {
    const ownedParkings = await ParkingLot.find({ owner: session.user.id }).select('_id').lean<Record<string, unknown>[]>();
    allowedParkingIds = ownedParkings.map((p) => String(p._id));
  } else if (session.user.role === 'operator') {
    const operator = await User.findById(session.user.id).select('assignedParking').lean<Record<string, unknown> | null>();
    const assigned = Array.isArray(operator?.assignedParking)
      ? operator?.assignedParking
      : operator?.assignedParking
        ? [operator.assignedParking]
        : [];
    allowedParkingIds = (assigned as unknown[]).map((id) => String(id));
  }

  if (allowedParkingIds && !allowedParkingIds.includes(parkinglotId)) {
    return NextResponse.json({ error: 'La playa indicada no pertenece al alcance del usuario logueado.' }, { status: 403 });
  }

  const existing = await Turno.findOne({
    operatorId: session.user.id,
    estado: 'abierto',
    esCajaAdministrativa: true,
  }).lean<Record<string, unknown> | null>();

  if (existing) {
    const existingParkingId = String((existing.parkinglotId ?? existing.assignedParking ?? '') || '');
    if (existingParkingId === parkinglotId) {
      return NextResponse.json({ ok: true, turno: existing }, { status: 200 });
    }
    return NextResponse.json({ error: 'Ya existe una caja administrativa abierta para este usuario.', turno: existing }, { status: 409 });
  }

  const turno = await Turno.create({
    operatorId: session.user.id,
    parkinglotId,
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
