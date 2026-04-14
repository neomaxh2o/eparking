import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Turno from '@/models/Turno';
import CajaMovimiento from '@/models/CajaMovimiento';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { turnoId, monto, paymentMethod, descripcion, idOperacion } = body || {};

    if (!turnoId) return NextResponse.json({ error: 'turnoId es requerido' }, { status: 400 });
    if (!monto || Number(monto) <= 0) return NextResponse.json({ error: 'monto inválido' }, { status: 400 });

    await dbConnect();

    // validate turno exists
    const turno = await Turno.findById(turnoId).lean();
    if (!turno) return NextResponse.json({ error: 'turno no encontrado' }, { status: 404 });

    // if idempotency key provided, check existing movement
    if (idOperacion) {
      const existing = await CajaMovimiento.findOne({ sourceId: idOperacion }).lean();
      if (existing) return NextResponse.json({ ok: true, existing }, { status: 200 });
    }

    // create movement
    const movimiento = await CajaMovimiento.create({
      turnoId: turno._id,
      sourceType: 'ajuste',
      sourceId: idOperacion ?? '',
      amount: Number(monto),
      paymentMethod: paymentMethod ?? '',
      paymentReference: descripcion ?? '',
      snapshot: { turnoId: String(turno._id) },
      actorRole: 'admin',
    });

    return NextResponse.json({ ok: true, movimiento }, { status: 201 });
  } catch (err: any) {
    console.error('POST /admin-cash/transaction error', err);
    return NextResponse.json({ error: 'error interno' }, { status: 500 });
  }
}
