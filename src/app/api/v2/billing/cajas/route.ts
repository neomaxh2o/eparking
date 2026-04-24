import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongoose';
import ParkingLot from '@/models/ParkingLot';
import Caja from '@/models/Caja';
import User from '@/models/User';

const ADMIN_CASH_TIPO_PRIORITY: Record<string, number> = {
  administrativa: 0,
  mixta: 1,
  operativa: 2,
};

type CajaResponseItem = {
  _id: string;
  parkinglotId: string;
  numero: number;
  code: string;
  displayName: string;
  tipo: string;
  activa: boolean;
};

async function resolveAllowedParkingIds(userId: string, role: string) {
  let allowedParkingIds: string[] | null = null;

  if (role === 'owner') {
    const ownedParkings = await ParkingLot.find({ owner: userId }).select('_id').lean<Record<string, unknown>[]>();
    allowedParkingIds = ownedParkings.map((parking) => String(parking._id));
  } else if (role === 'operator') {
    const operator = await User.findById(userId).select('assignedParking').lean<Record<string, unknown> | null>();
    const assigned = Array.isArray(operator?.assignedParking) ? operator.assignedParking : operator?.assignedParking ? [operator.assignedParking] : [];
    allowedParkingIds = (assigned as unknown[]).map((id) => String(id));
  }

  return allowedParkingIds;
}

function normalizeCaja(caja: Record<string, unknown>): CajaResponseItem {
  return {
    _id: String(caja._id),
    parkinglotId: String(caja.parkinglotId ?? ''),
    numero: Number(caja.numero ?? 0),
    code: String(caja.code ?? ''),
    displayName: String(caja.displayName ?? caja.code ?? `Caja ${String(caja.numero ?? '')}`),
    tipo: String(caja.tipo ?? 'operativa'),
    activa: Boolean(caja.activa ?? true),
  };
}

function sortCajas(a: CajaResponseItem, b: CajaResponseItem) {
  const parkingCompare = a.parkinglotId.localeCompare(b.parkinglotId);
  if (parkingCompare !== 0) return parkingCompare;
  const tipoCompare = (ADMIN_CASH_TIPO_PRIORITY[a.tipo] ?? 99) - (ADMIN_CASH_TIPO_PRIORITY[b.tipo] ?? 99);
  if (tipoCompare !== 0) return tipoCompare;
  return a.numero - b.numero;
}

function sanitizeCodePart(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function buildStableCajaCode(parkinglotId: string, parkingName: string, numero: number) {
  const slug = sanitizeCodePart(parkingName) || `parking-${parkinglotId.slice(-6).toLowerCase()}`;
  return `adm-${slug}-${String(numero).padStart(3, '0')}`;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  if (!['admin', 'owner', 'operator'].includes(session.user.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  await dbConnect();
  const { searchParams } = new URL(req.url);
  const parkinglotId = searchParams.get('parkinglotId');

  let allowedParkingIds = await resolveAllowedParkingIds(session.user.id, session.user.role);

  if (parkinglotId) {
    if (allowedParkingIds && !allowedParkingIds.includes(parkinglotId)) {
      return NextResponse.json({ error: 'La playa indicada no pertenece al alcance del usuario logueado.' }, { status: 403 });
    }
    allowedParkingIds = [parkinglotId];
  }

  const cajaQuery: Record<string, unknown> = {
    activa: true,
  };

  if (allowedParkingIds?.length) {
    cajaQuery.parkinglotId = { $in: allowedParkingIds };
  }

  const cajas = await Caja.find(cajaQuery)
    .select('_id parkinglotId numero code displayName tipo activa')
    .lean<Record<string, unknown>[]>();

  const items = cajas
    .map(normalizeCaja)
    .filter((caja) => caja.numero > 0)
    .sort(sortCajas);

  return NextResponse.json(items, { status: 200 });
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
  const parkinglotId = typeof body?.parkinglotId === 'string' ? body.parkinglotId.trim() : '';

  if (!parkinglotId) {
    return NextResponse.json({ error: 'parkinglotId es requerido' }, { status: 400 });
  }

  const allowedParkingIds = await resolveAllowedParkingIds(session.user.id, session.user.role);
  if (allowedParkingIds && !allowedParkingIds.includes(parkinglotId)) {
    return NextResponse.json({ error: 'La playa indicada no pertenece al alcance del usuario logueado.' }, { status: 403 });
  }

  const parking = await ParkingLot.findById(parkinglotId).select('_id name').lean<Record<string, unknown> | null>();
  if (!parking?._id) {
    return NextResponse.json({ error: 'La playa indicada no existe.' }, { status: 404 });
  }

  const existingCaja = await Caja.findOne({
    parkinglotId,
    activa: true,
    tipo: { $in: ['administrativa', 'mixta'] },
  })
    .sort({ numero: 1, createdAt: 1 })
    .select('_id parkinglotId numero code displayName tipo activa')
    .lean<Record<string, unknown> | null>();

  if (existingCaja) {
    return NextResponse.json({
      ok: true,
      created: false,
      caja: normalizeCaja(existingCaja),
    }, { status: 200 });
  }

  const highestCaja = await Caja.findOne({ parkinglotId }).sort({ numero: -1 }).select('numero').lean<Record<string, unknown> | null>();
  const nextNumero = Math.max(1, Number(highestCaja?.numero ?? 0) + 1);
  const parkingName = String(parking.name ?? 'Playa');
  const code = buildStableCajaCode(parkinglotId, parkingName, nextNumero);
  const displayName = `Caja administrativa ${parkingName} #${String(nextNumero).padStart(3, '0')}`;

  try {
    const createdCaja = await Caja.create({
      parkinglotId,
      parkingCode: sanitizeCodePart(parkingName) || `parking-${parkinglotId.slice(-6).toLowerCase()}`,
      numero: nextNumero,
      code,
      displayName,
      tipo: 'administrativa',
      activa: true,
    });

    return NextResponse.json({
      ok: true,
      created: true,
      caja: normalizeCaja(createdCaja.toObject() as Record<string, unknown>),
    }, { status: 201 });
  } catch (error: unknown) {
    const duplicate = typeof error === 'object' && error !== null && 'code' in error && Number((error as { code?: unknown }).code) === 11000;
    if (duplicate) {
      const concurrentCaja = await Caja.findOne({
        parkinglotId,
        activa: true,
        tipo: { $in: ['administrativa', 'mixta'] },
      })
        .sort({ numero: 1, createdAt: 1 })
        .select('_id parkinglotId numero code displayName tipo activa')
        .lean<Record<string, unknown> | null>();

      if (concurrentCaja) {
        return NextResponse.json({
          ok: true,
          created: false,
          caja: normalizeCaja(concurrentCaja),
        }, { status: 200 });
      }
    }

    throw error;
  }
}
