import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Abonado from '@/models/Abonado';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { emitAbonadoInvoice } from '@/modules/billing';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  if (session.user.role !== 'owner' && session.user.role !== 'admin' && session.user.role !== 'operator') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  await dbConnect();
  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));

  const query: Record<string, unknown> = { _id: id };
  if (session.user.role === 'owner') {
    query.ownerId = session.user.id;
  }

  const abonado = await Abonado.findOne(query);
  if (!abonado) {
    return NextResponse.json({ error: 'Abonado no encontrado' }, { status: 404 });
  }

  try {
    const invoice = await emitAbonadoInvoice({
      abonadoId: id,
      actorRole: session.user.role === 'operator' ? 'operator' : session.user.role === 'owner' ? 'owner' : 'admin',
      actorUserId: session.user.id,
      source: session.user.role === 'operator' ? 'operator' : 'admin',
      turnoId: body?.turnoId ?? null,
      cajaNumero: body?.cajaNumero ?? null,
      operatorId: session.user.role === 'operator' ? session.user.id : body?.operatorId ?? null,
      tipoFacturacion: body?.tipoFacturacion,
      monto: body?.monto,
      moneda: body?.moneda,
      periodoLabel: body?.periodoLabel,
      fechaVencimiento: body?.fechaVencimiento,
      estado: body?.estado,
      paymentReference: body?.paymentReference,
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'No se pudo emitir la factura.' }, { status: 400 });
  }
}
