import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongoose';
import { listBillingDocuments } from '@/modules/billing';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  if (session.user.role !== 'client') {
    return NextResponse.json({ error: 'No autorizado para panel cliente' }, { status: 403 });
  }

  await dbConnect();

  const estado = req.nextUrl.searchParams.get('estado');
  const query: Record<string, unknown> = { clientId: session.user.id };
  if (estado) query.estado = estado;

  const invoices = await listBillingDocuments(query);

  const normalized = invoices.map((invoice: any) => ({
    id: String(invoice._id),
    abonadoId: String(invoice.abonadoId ?? ''),
    invoiceCode: invoice.invoiceCode ?? '',
    estado: invoice.estado ?? 'pendiente',
    monto: Number(invoice.monto ?? 0),
    moneda: invoice.moneda ?? 'ARS',
    tipoFacturacion: invoice.tipoFacturacion ?? 'mensual',
    periodoLabel: invoice.periodoLabel ?? '',
    fechaEmision: invoice.fechaEmision ?? null,
    fechaVencimiento: invoice.fechaVencimiento ?? null,
    fechaPago: invoice.fechaPago ?? null,
    tarifaNombre: invoice.tarifaNombre ?? '',
    abonadoNombre: invoice.abonadoNombre ?? '',
    paymentProvider: invoice.paymentProvider ?? '',
    paymentReference: invoice.paymentReference ?? '',
    paymentMethod: invoice.paymentMethod ?? '',
    externalStatus: invoice.externalStatus ?? '',
  }));

  return NextResponse.json(normalized, { status: 200 });
}
