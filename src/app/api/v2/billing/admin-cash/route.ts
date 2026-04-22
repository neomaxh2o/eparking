import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongoose';
import Turno from '@/models/Turno';
import ParkingLot from '@/models/ParkingLot';
import User from '@/models/User';
import TurnoLiquidacion from '@/models/TurnoLiquidacion';
import { buildAdminTurnoLiquidacion } from '@/modules/admin-caja/server/admin-turno-liquidacion';

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
    esCajaAdministrativa: true,
    estado: { $in: ['abierto', 'liquidado'] },
  };

  if (parkinglotId) {
    query.$or = [{ parkinglotId }, { assignedParking: parkinglotId }];
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
    esCajaAdministrativa: true,
    estado: { $in: ['abierto', 'liquidado'] },
  }).sort({ createdAt: -1 }).lean<Record<string, unknown> | null>();

  if (existing) {
    const existingParkingId = String((existing.parkinglotId ?? existing.assignedParking ?? '') || '');
    if (existingParkingId === parkinglotId) {
      return NextResponse.json({ ok: true, turno: existing }, { status: 200 });
    }
    return NextResponse.json({ error: 'Ya existe una caja administrativa activa o recientemente liquidada para este usuario.', turno: existing }, { status: 409 });
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
  const action = String(body?.action ?? '').trim().toLowerCase();
  const liquidar = Boolean(body?.liquidar) || action === 'liquidar';
  const close = action === 'close';
  const observaciones = typeof body?.observado === 'string'
    ? body.observado
    : typeof body?.observaciones === 'string'
      ? body.observaciones
      : '';

  if (!turnoId) {
    return NextResponse.json({ error: 'turnoId es requerido' }, { status: 400 });
  }

  const turno = await Turno.findOne({
    _id: turnoId,
    operatorId: session.user.id,
    esCajaAdministrativa: true,
  });

  if (!turno) {
    return NextResponse.json({ error: 'Caja administrativa no encontrada.' }, { status: 404 });
  }

  if (liquidar) {
    if (String(turno.estado) === 'liquidado') {
      const existingLiquidacion = await TurnoLiquidacion.findOne({ turnoId }).lean<Record<string, unknown> | null>();
      if (existingLiquidacion) {
        return NextResponse.json({ ok: true, turno, liquidacion: existingLiquidacion }, { status: 200 });
      }
      return NextResponse.json({ error: 'El turno ya fue liquidado.' }, { status: 409 });
    }

    if (String(turno.estado) !== 'abierto') {
      return NextResponse.json({ error: 'Solo se puede liquidar un turno administrativo abierto.' }, { status: 409 });
    }

    const built = await buildAdminTurnoLiquidacion(turnoId, session.user.id, observaciones);

    const liquidacion = await TurnoLiquidacion.findOneAndUpdate(
      { turnoId },
      { $setOnInsert: built.payload },
      { new: true, upsert: true },
    );

    const fechaCierre = built.payload.fechaCierre ?? new Date();
    turno.estado = 'liquidado';
    turno.fechaCierre = fechaCierre;
    turno.totalTurno = built.payload.saldoTeorico;
    turno.observaciones = observaciones || turno.observaciones;
    turno.liquidacion = {
      efectivo: built.payload.totalEfectivo,
      tarjeta: built.payload.totalTarjeta,
      otros: built.payload.totalTransferencia + built.payload.totalOtros,
      totalDeclarado: built.payload.saldoDeclarado ?? built.payload.saldoTeorico,
      totalSistema: built.payload.saldoTeorico,
      diferencia: built.payload.diferenciaCaja ?? 0,
      tipoDiferencia: (built.payload.diferenciaCaja ?? 0) === 0 ? 'sin_diferencia' : (built.payload.diferenciaCaja ?? 0) > 0 ? 'sobrante' : 'faltante',
      observacion: observaciones,
      fechaLiquidacion: fechaCierre,
    };
    await turno.save();

    return NextResponse.json({ ok: true, turno, liquidacion }, { status: 200 });
  }

  if (close) {
    if (String(turno.estado) === 'liquidado') {
      return NextResponse.json({ error: 'El turno ya fue liquidado/cerrado y no admite más operaciones.' }, { status: 409 });
    }

    return NextResponse.json({ error: 'El cierre administrativo ahora se realiza liquidando el turno.' }, { status: 409 });
  }

  return NextResponse.json({ error: 'Acción no soportada.' }, { status: 400 });
}
