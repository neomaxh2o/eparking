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

  let allowedParkingIds: string[] | null = null;

  if (session.user.role === 'owner') {
    const ownedParkings = await ParkingLot.find({ owner: session.user.id }).select('_id').lean<Record<string, unknown>[]>();
    allowedParkingIds = ownedParkings.map((parking) => String(parking._id));
  } else if (session.user.role === 'operator') {
    const operator = await User.findById(session.user.id).select('assignedParking').lean<Record<string, unknown> | null>();
    const assigned = Array.isArray(operator?.assignedParking) ? operator.assignedParking : operator?.assignedParking ? [operator.assignedParking] : [];
    allowedParkingIds = (assigned as unknown[]).map((id) => String(id));
  }

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
    .map((caja) => ({
      _id: String(caja._id),
      parkinglotId: String(caja.parkinglotId ?? ''),
      numero: Number(caja.numero ?? 0),
      code: String(caja.code ?? ''),
      displayName: String(caja.displayName ?? caja.code ?? `Caja ${String(caja.numero ?? '')}`),
      tipo: String(caja.tipo ?? 'operativa'),
      activa: Boolean(caja.activa ?? true),
    }))
    .filter((caja) => caja.numero > 0)
    .sort((a, b) => {
      const parkingCompare = a.parkinglotId.localeCompare(b.parkinglotId);
      if (parkingCompare !== 0) return parkingCompare;
      const tipoCompare = (ADMIN_CASH_TIPO_PRIORITY[a.tipo] ?? 99) - (ADMIN_CASH_TIPO_PRIORITY[b.tipo] ?? 99);
      if (tipoCompare !== 0) return tipoCompare;
      return a.numero - b.numero;
    });

  return NextResponse.json(items, { status: 200 });
}
