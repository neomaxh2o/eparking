import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { accreditBillingDocument, getBillingDocumentById } from '@/modules/billing';
import Turno from '@/models/Turno';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ invoiceId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  if (session.user.role !== 'owner' && session.user.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  await dbConnect();
  const body = await req.json().catch(() => ({}));
  const { invoiceId } = await context.params;
  const adminCashTurnoId = body?.adminCashTurnoId ? String(body.adminCashTurnoId) : null;
  if (!adminCashTurnoId) {
    return NextResponse.json({ error: 'Debes indicar una caja administrativa activa para acreditar el cobro.' }, { status: 400 });
  }

  const query: Record<string, unknown> = { _id: invoiceId };
  if (session.user.role === 'owner') query.ownerId = session.user.id;

  const turno = await Turno.findOne({
    _id: adminCashTurnoId,
    operatorId: session.user.id,
    estado: 'abierto',
    esCajaAdministrativa: true,
  }).lean<Record<string, unknown> | null>();
  if (!turno) {
    return NextResponse.json({ error: 'Debes operar con una caja/turno administrativo abierto propio.' }, { status: 409 });
  }

  const invoice = await getBillingDocumentById(query);
  if (!invoice) {
    return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
  }

  const turnoParkingId = String((turno?.assignedParking ?? turno?.parkinglotId ?? '') || '');
  const invoiceParkingId = String(((invoice as any)?.assignedParking ?? '') || '');
  if (turnoParkingId && invoiceParkingId && turnoParkingId !== invoiceParkingId) {
    return NextResponse.json({ error: 'La caja/turno administrativo activo no pertenece a la misma playa de la factura.' }, { status: 409 });
  }

  const result = await accreditBillingDocument(query, {
    paymentProvider: body?.paymentProvider,
    paymentReference: body?.paymentReference,
    paymentMethod: body?.paymentMethod,
  });

  if (result.error === 'DOCUMENT_NOT_FOUND') {
    return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
  }

  if (result.error === 'ACCREDIT_ONLY_ABONADO') {
    return NextResponse.json(
      { error: 'La acreditación automática solo aplica a documentos de abonado.' },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, invoice: result.document, abonado: result.abonado }, { status: 200 });
}
