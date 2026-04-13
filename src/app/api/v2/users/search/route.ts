import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import User from '@/models/User';
import Abonado from '@/models/Abonado';
import AbonadoInvoice from '@/models/AbonadoInvoice';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  if (!['admin', 'owner'].includes(session.user.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  await connectToDatabase();

  const { searchParams } = new URL(req.url);
  const search = String(searchParams.get('search') ?? '').trim();
  const searchBy = String(searchParams.get('searchBy') ?? 'all').trim();

  const query: Record<string, any> = { role: 'client' };

  if (search) {
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    if (searchBy === 'dni') {
      query.dni = regex;
    } else if (searchBy === 'nombre') {
      query.$or = [{ nombre: regex }, { apellido: regex }];
    } else if (searchBy === 'email') {
      query.email = regex;
    } else {
      query.$or = [{ nombre: regex }, { apellido: regex }, { email: regex }, { dni: regex }];
    }
  }

  const users = await User.find(query, '-password')
    .populate('assignedParking', '_id name')
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  const userIds = users.map((user: any) => user._id);
  const abonados = await Abonado.find({ clientId: { $in: userIds } }, { clientId: 1, numeroAbonado: 1, estado: 1 }).lean();
  const abonadosByClientId = abonados.reduce((acc: Record<string, any>, abonado: any) => {
    acc[String(abonado.clientId)] = abonado;
    return acc;
  }, {});

  const abonadoIds = abonados.map((abonado: any) => abonado._id);
  const pendingInvoices = abonadoIds.length
    ? await AbonadoInvoice.aggregate([
        {
          $match: {
            abonadoId: { $in: abonadoIds },
            estado: { $in: ['emitida', 'pendiente', 'vencida'] },
          },
        },
        {
          $group: {
            _id: '$abonadoId',
            count: { $sum: 1 },
            total: { $sum: '$monto' },
          },
        },
      ])
    : [];

  const pendingByAbonadoId = pendingInvoices.reduce((acc: Record<string, any>, item: any) => {
    acc[String(item._id)] = item;
    return acc;
  }, {});

  const enrichedUsers = users.map((user: any) => {
    const abonado = abonadosByClientId[String(user._id)] ?? null;
    const pending = abonado ? pendingByAbonadoId[String(abonado._id)] ?? null : null;

    return {
      ...user,
      commercialStatus: {
        hasAbonado: Boolean(abonado),
        numeroAbonado: abonado?.numeroAbonado ?? null,
        abonadoEstado: abonado?.estado ?? null,
        pendingDocuments: Number(pending?.count ?? 0),
        pendingAmount: Number(pending?.total ?? 0),
      },
    };
  });

  return NextResponse.json({ users: enrichedUsers }, { status: 200 });
}
