import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongoose';
import ParkingLot from '@/models/ParkingLot';
import Turno from '@/models/Turno';
import User from '@/models/User';

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
    const ownedParkings = await ParkingLot.find({ owner: session.user.id }).select('_id').lean();
    allowedParkingIds = ownedParkings.map((parking) => String((parking as any)._id));
  } else if (session.user.role === 'operator') {
    const operator = await User.findById(session.user.id).select('assignedParking').lean();
    const assigned = Array.isArray((operator as any)?.assignedParking)
      ? (operator as any).assignedParking
      : (operator as any)?.assignedParking
        ? [(operator as any).assignedParking]
        : [];
    allowedParkingIds = assigned.map((id: any) => String(id));
  }

  if (parkinglotId) {
    if (allowedParkingIds && !allowedParkingIds.includes(parkinglotId)) {
      return NextResponse.json({ error: 'La playa indicada no pertenece al alcance del usuario logueado.' }, { status: 403 });
    }
    allowedParkingIds = [parkinglotId];
  }

  let operatorIds: string[] | null = null;

  if (allowedParkingIds) {
    const operators = await User.find({ assignedParking: { $in: allowedParkingIds }, role: 'operator' })
      .select('_id')
      .lean();
    operatorIds = operators.map((operator) => String((operator as any)._id));
  }

  const turnoQuery: Record<string, unknown> = {};
  if (session.user.role === 'operator') {
    turnoQuery.operatorId = session.user.id;
  } else if (operatorIds) {
    turnoQuery.operatorId = { $in: operatorIds };
  }

  const turnos = await Turno.find(turnoQuery).select('numeroCaja cajaNumero operatorId').lean();

  const cajas = Array.from(
    new Set(
      turnos
        .map((turno: any) => Number(turno.numeroCaja ?? turno.cajaNumero ?? 0))
        .filter((value) => Number.isFinite(value) && value > 0),
    ),
  ).sort((a, b) => a - b);

  return NextResponse.json(cajas.map((numero) => ({ numero })), { status: 200 });
}
