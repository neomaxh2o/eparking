import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongoose';
import Abonado from '@/models/Abonado';
import AbonadoInvoice from '@/models/AbonadoInvoice';
import CajaMovimiento from '@/models/CajaMovimiento';
import Turno from '@/models/Turno';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    if (!['admin', 'owner'].includes(session.user.role)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const body: unknown = await req.json().catch(() => null);
    const b = (body && typeof body === 'object') ? (body as Record<string, unknown>) : {};
    const abonadoId = b.abonadoId as string | undefined;
    const facturaId = b.facturaId as string | undefined;
    const monto = b.monto as unknown;
    const turnoId = b.turnoId as string | undefined;
    const cajaNumero = b.cajaNumero as unknown;
    const idOperacion = b.idOperacion as string | undefined;

    if (!abonadoId) return NextResponse.json({ error: 'abonadoId es requerido' }, { status: 400 });
    if (!turnoId) return NextResponse.json({ error: 'turnoId es requerido para registrar el pago en caja.' }, { status: 400 });
    const amountNum = Number(monto);
    if (!monto || Number.isNaN(amountNum) || amountNum <= 0) return NextResponse.json({ error: 'monto inválido' }, { status: 400 });

    await dbConnect();

    const turno = await Turno.findOne({
      _id: turnoId,
      operatorId: session.user.id,
      estado: 'abierto',
      esCajaAdministrativa: true,
    }).lean();
    if (!turno) return NextResponse.json({ error: 'Debes operar con una caja/turno administrativo abierto propio.' }, { status: 409 });

    // validate abonado
    const abonado = await Abonado.findById(abonadoId).lean();
    if (!abonado) return NextResponse.json({ error: 'abonado no encontrado' }, { status: 404 });

    // idempotency check via CajaMovimiento.sourceId
    if (idOperacion) {
      const existing = await CajaMovimiento.findOne({ sourceId: idOperacion }).lean();
      if (existing) return NextResponse.json({ ok: true, existing }, { status: 200 });
    }

    // if facturaId provided -> pay invoice (only full payment supported now)
    if (!facturaId) {
      return NextResponse.json({ error: 'pago sin facturaId no soportado en esta fase' }, { status: 400 });
    }

    const factura = await AbonadoInvoice.findById(facturaId);
    if (!factura) return NextResponse.json({ error: 'factura no encontrada' }, { status: 404 });

    const amount = amountNum;
    if (amount < Number(factura.monto || 0)) {
      return NextResponse.json({ error: 'pago parcial no soportado (en esta fase)' }, { status: 400 });
    }

    // mark invoice paid
    factura.estado = 'pagada';
    factura.fechaPago = new Date();
    factura.paymentMethod = factura.paymentMethod || 'admin-cash';
    factura.paymentReference = factura.paymentReference || '';
    await factura.save();

    // create caja movimiento
    const movimiento = await CajaMovimiento.create({
      turnoId: String((turno as any)._id),
      sourceType: 'abonado',
      sourceId: idOperacion ?? factura._id.toString(),
      amount: amount,
      paymentMethod: 'abonado',
      paymentReference: `Pago factura ${factura._id}`,
      snapshot: { abonadoId: String((abonado as any)._id), facturaId: String(factura._id) },
      actorRole: 'admin',
      cajaId: null,
      cajaCode: '',
      createdAt: new Date(),
    });

    return NextResponse.json({ ok: true, movimiento, factura }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error) console.error('POST /facturacion/pagar error', err.message);
    else console.error('POST /facturacion/pagar error', String(err));
    return NextResponse.json({ error: 'error interno' }, { status: 500 });
  }
}
