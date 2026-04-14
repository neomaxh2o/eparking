import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import TurnoReport from '@/models/TurnoReport';
import { requireOwnerAdminSession } from '@/lib/turno-report-auth';

export async function GET(req: Request) {
  try {
    const auth = await requireOwnerAdminSession();
    if (!auth?.authorized) {
      return NextResponse.json({ error: auth?.error || 'No autenticado' }, { status: auth?.status || 401 });
    }
    const session = auth.session;
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const ownerId = searchParams.get('ownerId');
    const parkinglotId = searchParams.get('parkinglotId');
    const turnoId = searchParams.get('turnoId');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const paymentMethod = searchParams.get('paymentMethod');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const limit = Math.max(1, Math.min(200, Number(searchParams.get('limit') ?? '50')));
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {};

    if (session.user.role === 'owner') {
      query.ownerId = session.user.id;
    } else if (ownerId) {
      query.ownerId = ownerId;
    }

    if (parkinglotId) query.parkinglotId = parkinglotId;
    if (turnoId) query.turnoId = turnoId;
    if (status) query.status = status;
    if (paymentMethod) query.paymentMethod = paymentMethod;

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        query.createdAt.$lte = to;
      }
    }

    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { ticketNumber: regex },
        { plate: regex },
        { operatorName: regex },
        { parkingName: regex },
        { notes: regex },
      ];
    }

    const [items, total] = await Promise.all([
      TurnoReport.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      TurnoReport.countDocuments(query),
    ]);

    return NextResponse.json(
      {
        items,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('[api/v2/turno-reportes][GET]', error);
    return NextResponse.json(
      { error: error?.message || 'No se pudo obtener el histórico de cajas.' },
      { status: 500 },
    );
  }
}
