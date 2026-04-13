import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { accreditBillingDocument } from '@/modules/billing';

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

  const query: Record<string, unknown> = { _id: invoiceId };
  if (session.user.role === 'owner') query.ownerId = session.user.id;

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
