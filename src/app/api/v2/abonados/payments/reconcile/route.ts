import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import AbonadoInvoice from '@/models/AbonadoInvoice';
import Abonado from '@/models/Abonado';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  if (session.user.role !== 'owner' && session.user.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  await dbConnect();
  const body = await req.json().catch(() => ({}));
  const paymentReference = String(body?.paymentReference ?? '').trim();
  if (!paymentReference) {
    return NextResponse.json({ error: 'Falta paymentReference' }, { status: 400 });
  }

  const query: Record<string, unknown> = {
    paymentReference,
    estado: { $in: ['emitida', 'pendiente', 'vencida'] },
  };
  if (session.user.role === 'owner') query.ownerId = session.user.id;

  const invoices = await AbonadoInvoice.find(query);
  if (!invoices.length) {
    return NextResponse.json({ error: 'No se encontraron facturas para esa referencia.' }, { status: 404 });
  }

  const updatedInvoices = [];
  const reactivatedAbonados = [];

  for (const invoice of invoices) {
    invoice.estado = 'pagada';
    invoice.fechaPago = new Date();
    invoice.paymentProvider = body?.paymentProvider ?? invoice.paymentProvider ?? 'electronic';
    invoice.paymentMethod = body?.paymentMethod ?? invoice.paymentMethod ?? 'electronic';
    invoice.acreditadoAutomaticamente = true;
    await invoice.save();
    updatedInvoices.push(invoice);

    const abonado = await Abonado.findById(invoice.abonadoId);
    if (!abonado) continue;

    const remainingOverdue = await AbonadoInvoice.exists({
      abonadoId: abonado._id,
      estado: 'vencida',
      _id: { $ne: invoice._id },
      ...(session.user.role === 'owner' ? { ownerId: session.user.id } : {}),
    });

    if (!remainingOverdue && (abonado.estado === 'suspendido' || abonado.estado === 'vencido')) {
      abonado.estado = 'activo';
      await abonado.save();
      reactivatedAbonados.push(abonado._id);
    }
  }

  return NextResponse.json({
    ok: true,
    paymentReference,
    invoicesUpdated: updatedInvoices.length,
    abonadosReactivated: reactivatedAbonados.length,
  }, { status: 200 });
}
