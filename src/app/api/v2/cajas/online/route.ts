import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongoose';
import ParkingLot from '@/models/ParkingLot';
import Caja from '@/models/Caja';
import Turno from '@/models/Turno';
import CajaMovimiento from '@/models/CajaMovimiento';
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

  let allowedParkingIds: string[] | null = null;
  if (session.user.role === 'owner') {
    const owned = await ParkingLot.find({ owner: session.user.id }).select('_id').lean();
    allowedParkingIds = owned.map((p: any) => String(p._id));
  }

  if (parkinglotId) {
    if (allowedParkingIds && !allowedParkingIds.includes(parkinglotId)) {
      return NextResponse.json({ error: 'La playa indicada no pertenece al alcance del usuario logueado.' }, { status: 403 });
    }
    allowedParkingIds = [parkinglotId];
  }

  const cajaQuery: Record<string, unknown> = { activa: true };
  if (allowedParkingIds?.length) cajaQuery.parkinglotId = { $in: allowedParkingIds };

  const [cajas, turnos, movimientos] = await Promise.all([
    Caja.find(cajaQuery).sort({ parkingCode: 1, numero: 1 }).lean(),
    Turno.find({ estado: 'abierto', ...(allowedParkingIds?.length ? { parkinglotId: { $in: allowedParkingIds } } : {}) })
      .select('_id operatorId parkinglotId cajaId cajaCode numeroCaja cajaNumero esCajaAdministrativa fechaApertura totalTurno')
      .lean(),
    CajaMovimiento.find(allowedParkingIds?.length ? { parkinglotId: { $in: allowedParkingIds } } : {})
      .sort({ createdAt: -1 })
      .limit(500)
      .lean(),
  ]);

  const operatorIds = Array.from(new Set(turnos.map((t: any) => String(t.operatorId || '')).filter(Boolean)));
  const operators = operatorIds.length
    ? await User.find({ _id: { $in: operatorIds } }).select('_id name nombre apellido email').lean()
    : [];
  const operatorById = operators.reduce((acc: Record<string, any>, item: any) => {
    acc[String(item._id)] = item;
    return acc;
  }, {});

  const turnosByCajaId = turnos.reduce((acc: Record<string, any>, turno: any) => {
    if (turno?.cajaId) acc[String(turno.cajaId)] = turno;
    return acc;
  }, {});

  const movimientosByCajaId = movimientos.reduce((acc: Record<string, any[]>, mov: any) => {
    const key = mov?.cajaId ? String(mov.cajaId) : '__none__';
    acc[key] = acc[key] || [];
    acc[key].push(mov);
    return acc;
  }, {});

  const items = cajas.map((caja: any) => {
    const turno = turnosByCajaId[String(caja._id)] ?? null;
    const turnoMovs = movimientosByCajaId[String(caja._id)] ?? [];
    const operator = turno?.operatorId ? operatorById[String(turno.operatorId)] : null;

    const totals = turnoMovs.reduce((acc, mov) => {
      const amount = Number(mov?.amount ?? 0);
      const method = String(mov?.paymentMethod ?? '').toLowerCase();
      acc.total += amount;
      if (method.includes('efec')) acc.efectivo += amount;
      else if (method.includes('tarj')) acc.tarjeta += amount;
      else if (method.includes('qr')) acc.qr += amount;
      else acc.otros += amount;
      return acc;
    }, { total: 0, efectivo: 0, tarjeta: 0, qr: 0, otros: 0 });

    return {
      _id: String(caja._id),
      parkinglotId: String(caja.parkinglotId),
      code: String(caja.code ?? ''),
      displayName: String(caja.displayName ?? caja.code ?? ''),
      numero: Number(caja.numero ?? 0),
      tipo: String(caja.tipo ?? 'operativa'),
      activa: Boolean(caja.activa ?? true),
      turnoAbierto: turno ? {
        _id: String(turno._id),
        cajaCode: String(turno.cajaCode ?? caja.code ?? ''),
        fechaApertura: turno.fechaApertura,
        esCajaAdministrativa: Boolean(turno.esCajaAdministrativa ?? false),
        totalTurno: Number(turno.totalTurno ?? 0),
        operatorId: String(turno.operatorId ?? ''),
        operatorName: operator ? ((operator as any).name || `${(operator as any).nombre ?? ''} ${(operator as any).apellido ?? ''}`.trim()) : '',
        operatorEmail: operator ? String((operator as any).email ?? '') : '',
      } : null,
      metrics: {
        movimientos: turnoMovs.length,
        total: Number(totals.total.toFixed(2)),
        efectivo: Number(totals.efectivo.toFixed(2)),
        tarjeta: Number(totals.tarjeta.toFixed(2)),
        qr: Number(totals.qr.toFixed(2)),
        otros: Number(totals.otros.toFixed(2)),
      },
      latestMovements: turnoMovs.slice(0, 10).map((mov: any) => ({
        _id: String(mov._id),
        sourceType: String(mov.sourceType ?? ''),
        sourceId: String(mov.sourceId ?? ''),
        amount: Number(mov.amount ?? 0),
        paymentMethod: String(mov.paymentMethod ?? ''),
        paymentReference: String(mov.paymentReference ?? ''),
        status: String(mov.status ?? ''),
        createdAt: mov.createdAt,
        snapshot: mov.snapshot ?? {},
      })),
    };
  });

  return NextResponse.json({ items }, { status: 200 });
}
