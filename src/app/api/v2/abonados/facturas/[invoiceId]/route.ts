import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { updateBillingDocumentState } from '@/modules/billing';

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ invoiceId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  if (session.user.role !== 'owner' && session.user.role !== 'admin' && session.user.role !== 'operator') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  await dbConnect();
  const body = await req.json();
  const { invoiceId } = await context.params;

  const query: Record<string, unknown> = { _id: invoiceId };
  if (session.user.role === 'owner') query.ownerId = session.user.id;

  const result = await updateBillingDocumentState(query, {
    estado: body?.estado,
    fechaVencimiento: body?.fechaVencimiento,
    clearFechaPago: body?.clearFechaPago,
  });

  if (result.error === 'DOCUMENT_NOT_FOUND') {
    return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
  }

  if (result.error === 'INVALID_STATE_FOR_TICKET') {
    return NextResponse.json(
      { error: 'Los documentos de ticket no admiten estado vencida.' },
      { status: 400 },
    );
  }

  return NextResponse.json(result.document, { status: 200 });
}
