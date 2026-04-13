import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Abonado from '@/models/Abonado';
import AbonadoInvoice from '@/models/AbonadoInvoice';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  if (session.user.role !== 'owner' && session.user.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  await dbConnect();
  const { id } = await context.params;
  const query: Record<string, unknown> = { _id: id };
  if (session.user.role === 'owner') query.ownerId = session.user.id;

  const abonado = await Abonado.findOne(query).lean();
  if (!abonado) {
    return NextResponse.json({ error: 'Abonado no encontrado' }, { status: 404 });
  }

  const invoices = await AbonadoInvoice.find({ abonadoId: id }).sort({ createdAt: -1 }).lean();
  const deuda = invoices.some((invoice: any) => invoice.estado === 'emitida' || invoice.estado === 'pendiente' || invoice.estado === 'vencida');
  const moroso = invoices.some((invoice: any) => invoice.estado === 'vencida');

  return NextResponse.json({
    ...abonado,
    financialStatus: moroso ? 'moroso' : deuda ? 'con_deuda' : 'al_dia',
    hasDebt: deuda,
    hasOverdueDebt: moroso,
  });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  if (session.user.role !== 'owner' && session.user.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  await dbConnect();
  const { id } = await context.params;
  const body = await req.json();

  const query: Record<string, unknown> = { _id: id };
  if (session.user.role === 'owner') {
    query.ownerId = session.user.id;
  }

  const updated = await Abonado.findOneAndUpdate(query, body, { new: true });
  if (!updated) {
    return NextResponse.json({ error: 'Abonado no encontrado' }, { status: 404 });
  }

  return NextResponse.json(updated, { status: 200 });
}
