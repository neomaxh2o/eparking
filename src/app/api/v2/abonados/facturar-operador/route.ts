import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Abonado from '@/models/Abonado';
import Turno from '@/models/Turno';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { emitAbonadoInvoice } from '@/modules/billing';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  if (session.user.role !== 'operator' && session.user.role !== 'owner' && session.user.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  await dbConnect();
  const body = await req.json().catch(() => ({}));
  const abonadoId = body?.abonadoId;
  if (!abonadoId) {
    return NextResponse.json({ error: 'Falta abonadoId' }, { status: 400 });
  }

  const abonado = await Abonado.findById(abonadoId);
  if (!abonado) {
    return NextResponse.json({ error: 'Abonado no encontrado' }, { status: 404 });
  }

  let turnoId = body?.turnoId ?? null;
  let cajaNumero = body?.cajaNumero ?? null;

  if (session.user.role === 'operator') {
    const operador = await User.findById(session.user.id).select('assignedParking').lean();
    const turno = await Turno.findOne({ operatorId: session.user.id, estado: 'abierto' }).lean();
    if (!turno) {
      return NextResponse.json({ error: 'No hay turno abierto para facturar desde operador.' }, { status: 400 });
    }

    if (operador?.assignedParking && abonado.assignedParking && String(operador.assignedParking) !== String(abonado.assignedParking)) {
      return NextResponse.json({ error: 'El abonado pertenece a otra playa.' }, { status: 403 });
    }

    turnoId = String(turno._id);
    cajaNumero = Number((turno as { cajaNumero?: number; numeroCaja?: number }).cajaNumero ?? (turno as { numeroCaja?: number }).numeroCaja ?? 1);
  }

  try {
    const invoice = await emitAbonadoInvoice({
      abonadoId,
      actorRole: session.user.role === 'operator' ? 'operator' : session.user.role === 'owner' ? 'owner' : 'admin',
      actorUserId: session.user.id,
      source: session.user.role === 'operator' ? 'operator' : 'admin',
      turnoId,
      cajaNumero,
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
