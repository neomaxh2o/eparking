import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import AbonadoInvoice from '@/models/AbonadoInvoice';
import Abonado from '@/models/Abonado';

export async function POST(req: NextRequest) {
  const secret = process.env.ABONADOS_PAYMENT_WEBHOOK_SECRET;
  const incoming = req.headers.get('x-abonados-webhook-secret');

  if (secret && incoming !== secret) {
    return NextResponse.json({ error: 'Webhook no autorizado' }, { status: 401 });
  }

  await dbConnect();
  const body = await req.json().catch(() => ({}));
  const paymentReference = String(body?.paymentReference ?? body?.reference ?? body?.external_reference ?? '').trim();
  const paymentProvider = String(body?.paymentProvider ?? body?.provider ?? (body?.external_reference ? 'mercadopago' : 'external'));
  const paymentMethod = String(body?.paymentMethod ?? body?.method ?? body?.payment_type_id ?? 'electronic');
  const externalStatus = String(body?.externalStatus ?? body?.status ?? '').trim().toLowerCase();

  if (!paymentReference) {
    return NextResponse.json({ error: 'Falta paymentReference' }, { status: 400 });
  }

  const invoices = await AbonadoInvoice.find({
    paymentReference,
    estado: { $in: ['emitida', 'pendiente', 'vencida'] },
  });

  if (!invoices.length) {
    return NextResponse.json({ ok: true, paymentReference, invoicesUpdated: 0, abonadosReactivated: 0, ignored: true }, { status: 200 });
  }

  const successStatuses = new Set(['paid', 'approved', 'accredited', 'success', 'succeeded']);
  if (!successStatuses.has(externalStatus)) {
    for (const invoice of invoices) {
      invoice.paymentProvider = paymentProvider;
      invoice.paymentMethod = paymentMethod;
      invoice.externalStatus = externalStatus;
      invoice.externalPayload = body;
      await invoice.save();
    }
    return NextResponse.json({ ok: true, paymentReference, invoicesUpdated: 0, abonadosReactivated: 0, externalStatus, ignored: true }, { status: 200 });
  }

  let invoicesUpdated = 0;
  let abonadosReactivated = 0;

  for (const invoice of invoices) {
    invoice.estado = 'pagada';
    invoice.fechaPago = new Date();
    invoice.paymentProvider = paymentProvider;
    invoice.paymentReference = paymentReference;
    invoice.paymentMethod = paymentMethod;
    invoice.acreditadoAutomaticamente = true;
    invoice.externalStatus = externalStatus;
    invoice.externalPayload = body;
    await invoice.save();
    invoicesUpdated += 1;

    const abonado = await Abonado.findById(invoice.abonadoId);
    if (!abonado) continue;

    const remainingOverdue = await AbonadoInvoice.exists({
      abonadoId: abonado._id,
      estado: 'vencida',
      _id: { $ne: invoice._id },
    });

    if (!remainingOverdue && (abonado.estado === 'suspendido' || abonado.estado === 'vencido')) {
      abonado.estado = 'activo';
      await abonado.save();
      abonadosReactivated += 1;
    }
  }

  return NextResponse.json({ ok: true, paymentReference, invoicesUpdated, abonadosReactivated, externalStatus }, { status: 200 });
}
