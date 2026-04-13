import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import CashMovement from '@/models/CashMovement';
import { requireOperatorSession } from '@/lib/requireOperatorSession';

export async function POST(req: Request) {
  const traceId = req.headers.get('x-trace-id') || 'trace-missing';
  try {
    const session = await requireOperatorSession(req);
    await dbConnect();
    const body = await req.json();
    if (!body.amount || body.amount <= 0) throw new Error('invalid amount');
    // infer storeId from shift if provided
    let storeId = session.storeId;
    if (!storeId && body.shiftId) {
      const Shift = (await import('@/models/Shift')).default;
      const shift = await Shift.findById(body.shiftId);
      if (shift) storeId = shift.storeId;
    }
    if (!storeId) throw new Error('storeId not found');

    const mv = await CashMovement.create({
      shiftId: body.shiftId || null,
      storeId,
      createdBy: session.user._id,
      type: body.type || 'adjustment',
      amount: body.amount,
      direction: body.direction || (body.amount > 0 ? 'in' : 'out'),
      reason: body.reason || '',
      reference: body.reference || ''
    });
    console.log(`[${traceId}] cash.movement ${mv._id}`);
    return NextResponse.json({ ok: true, mv });
  } catch (err: any) {
    console.error(`[${traceId}] cash.movement error`, err.message || err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}

export async function GET(req: Request) {
  const traceId = req.headers.get('x-trace-id') || 'trace-missing';
  try {
    const session = await requireOperatorSession(req);
    await dbConnect();
    const items = await CashMovement.find({ storeId: session.storeId }).limit(100).sort({ createdAt: -1 });
    return NextResponse.json({ ok: true, items });
  } catch (err: any) {
    console.error(`[${traceId}] cash.movement.list error`, err.message || err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
