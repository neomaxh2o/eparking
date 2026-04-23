import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongoose';
import Turno from '@/models/Turno';
import ParkingLot from '@/models/ParkingLot';
import User from '@/models/User';
import Caja from '@/models/Caja';
import TurnoLiquidacion from '@/models/TurnoLiquidacion';
import { buildAdminTurnoLiquidacion } from '@/modules/admin-caja/server/admin-turno-liquidacion';

const ADMIN_CASH_TIPO_PRIORITY: Record<string, number> = {
  administrativa: 0,
  mixta: 1,
  operativa: 2,
};

type CajaCandidate = {
  _id: string;
  parkinglotId: string;
  numero: number;
  code: string;
  displayName: string;
  tipo: string;
};

async function resolveAllowedParkingIds(userId: string, role: string) {
  let allowedParkingIds: string[] | null = null;

  if (role === 'owner') {
    const ownedParkings = await ParkingLot.find({ owner: userId }).select('_id').lean<Record<string, unknown>[]>();
    allowedParkingIds = ownedParkings.map((p) => String(p._id));
  } else if (role === 'operator') {
    const operator = await User.findById(userId).select('assignedParking').lean<Record<string, unknown> | null>();
    const assigned = Array.isArray(operator?.assignedParking)
      ? operator.assignedParking
      : operator?.assignedParking
        ? [operator.assignedParking]
        : [];
    allowedParkingIds = (assigned as unknown[]).map((id) => String(id));
  }

  return allowedParkingIds;
}

async function findValidAdminCashCajas(parkinglotId: string): Promise<CajaCandidate[]> {
  const cajas = await Caja.find({ parkinglotId, activa: true })
    .select('_id parkinglotId numero code displayName tipo')
    .lean<Record<string, unknown>[]>();

  return cajas
    .map((caja) => ({
      _id: String(caja._id),
      parkinglotId: String(caja.parkinglotId ?? ''),
      numero: Number(caja.numero ?? 0),
      code: String(caja.code ?? ''),
      displayName: String(caja.displayName ?? caja.code ?? `Caja ${String(caja.numero ?? '')}`),
      tipo: String(caja.tipo ?? 'operativa'),
    }))
    .filter((caja) => caja.numero > 0)
    .sort((a, b) => {
      const tipoCompare = (ADMIN_CASH_TIPO_PRIORITY[a.tipo] ?? 99) - (ADMIN_CASH_TIPO_PRIORITY[b.tipo] ?? 99);
      if (tipoCompare !== 0) return tipoCompare;
      return a.numero - b.numero;
    });
}

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
    estado: 'abierto',
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
  const requestedCajaNumero = b?.cajaNumero == null || b?.cajaNumero === '' ? null : Number(b.cajaNumero);

  if (!parkinglotId) {
    return NextResponse.json({ error: 'parkinglotId es requerido' }, { status: 400 });
  }

  const allowedParkingIds = await resolveAllowedParkingIds(session.user.id, session.user.role);
  if (allowedParkingIds && !allowedParkingIds.includes(parkinglotId)) {
    return NextResponse.json({ error: 'La playa indicada no pertenece al alcance del usuario logueado.' }, { status: 403 });
  }

  const validCajas = await findValidAdminCashCajas(parkinglotId);

  if (!validCajas.length) {
    return NextResponse.json({ error: 'No hay cajas activas configuradas para esta playa. Configurá una caja administrativa o mixta antes de abrir el turno administrativo.' }, { status: 409 });
  }

  let selectedCaja: CajaCandidate | null = null;

  if (requestedCajaNumero != null) {
    if (!Number.isFinite(requestedCajaNumero) || requestedCajaNumero <= 0) {
      return NextResponse.json({ error: 'cajaNumero debe ser un número válido.' }, { status: 400 });
    }

    selectedCaja = validCajas.find((caja) => caja.numero === requestedCajaNumero) ?? null;
    if (!selectedCaja) {
      return NextResponse.json({ error: 'La caja seleccionada no existe, no pertenece a la playa indicada o está inactiva.' }, { status: 400 });
    }
  } else if (validCajas.length === 1) {
    selectedCaja = validCajas[0];
  } else {
    return NextResponse.json({ error: 'Esta playa tiene múltiples cajas activas. Seleccioná una caja válida antes de abrir el turno administrativo.' }, { status: 400 });
  }

  const existing = await Turno.findOne({
    operatorId: session.user.id,
    esCajaAdministrativa: true,
    estado: 'abierto',
  }).sort({ createdAt: -1 }).lean<Record<string, unknown> | null>();

  if (existing) {
    const existingParkingId = String((existing.parkinglotId ?? existing.assignedParking ?? '') || '');
    const existingCajaNumero = Number(existing.numeroCaja ?? existing.cajaNumero ?? 0);
    if (existingParkingId === parkinglotId && existingCajaNumero === selectedCaja.numero) {
      return NextResponse.json({ ok: true, turno: existing }, { status: 200 });
    }
    return NextResponse.json({ error: 'Ya existe una caja administrativa abierta para este usuario.', turno: existing }, { status: 409 });
  }

  const turno = await Turno.create({
    operatorId: session.user.id,
    parkinglotId,
    assignedParking: parkinglotId,
    numeroCaja: selectedCaja.numero,
    cajaNumero: selectedCaja.numero,
    estado: 'abierto',
    esCajaAdministrativa: true,
    observaciones: `Caja administrativa abierta desde Facturación (${selectedCaja.displayName})`,
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
