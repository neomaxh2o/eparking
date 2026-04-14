import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Turno from '@/models/Turno';
import CajaMovimiento from '@/models/CajaMovimiento';

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json().catch(() => null);
    const b = (body && typeof body === 'object') ? (body as Record<string, unknown>) : {};
    const turnoId = b.turnoId as string | undefined;
    const monto = b.monto as unknown;
    const paymentMethod = b.paymentMethod as string | undefined;
    const descripcion = b.descripcion as string | undefined;
    const idOperacion = b.idOperacion as string | undefined;

    if (!turnoId) return NextResponse.json({ error: 'turnoId es requerido' }, { status: 400 });
    const amountNum = Number(monto);
    if (!monto || Number.isNaN(amountNum) || amountNum <= 0) return NextResponse.json({ error: 'monto inválido' }, { status: 400 });

    await dbConnect();

    // validate turno exists
    const turno = await Turno.findById(turnoId).lean<Record<string, unknown> | null>();
    if (!turno) return NextResponse.json({ error: 'turno no encontrado' }, { status: 404 });

    // if idempotency key provided, check existing movement
    if (idOperacion) {
      const existing = await CajaMovimiento.findOne({ sourceId: idOperacion }).lean<Record<string, unknown> | null>();
      if (existing) return NextResponse.json({ ok: true, existing }, { status: 200 });
    }

    // create movement
    const turnoOid = String((turno && (turno._id ?? (turno as Record<string, unknown>).id)) ?? turnoId);
    const movimiento = await CajaMovimiento.create({
      turnoId: turnoOid,
      sourceType: 'ajuste',
      sourceId: idOperacion ?? '',
      amount: amountNum,
      paymentMethod: paymentMethod ?? '',
      paymentReference: descripcion ?? '',
      snapshot: { turnoId: turnoOid },
      actorRole: 'admin',
    });

    return NextResponse.json({ ok: true, movimiento }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error) console.error('POST /admin-cash/transaction error', err.message);
    else console.error('POST /admin-cash/transaction error', String(err));
    return NextResponse.json({ error: 'error interno' }, { status: 500 });
  }
}
