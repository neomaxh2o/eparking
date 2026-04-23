import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import CashMovement from '@/models/CashMovement';
import { requireOperatorSession } from '@/lib/requireOperatorSession';

import { NextRequest } from 'next/server';
export async function POST(req: NextRequest) {
  const traceId = req.headers.get('x-trace-id') || 'trace-missing';
  try {
    const session = await requireOperatorSession(req);
    await dbConnect();
    const raw: unknown = await req.json().catch(() => null);
    const body = (raw && typeof raw === 'object') ? (raw as Record<string, unknown>) : {};
    const amount = Number(body.amount ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('invalid amount');
    // infer storeId from shift if provided
    let storeId = session.storeId as string | null;
    if (!storeId && body.shiftId) {
      const Shift = (await import('@/models/Shift')).default;
      const shift = await Shift.findById(String(body.shiftId)).lean<Record<string, unknown> | null>();
      if (shift) storeId = String(shift.storeId);
    }
    if (!storeId) throw new Error('storeId not found');

    const mv = await CashMovement.create({
      shiftId: body.shiftId ?? null,
      storeId,
      createdBy: session.user._id,
      type: String(body.type ?? 'adjustment'),
      amount,
      direction: String(body.direction ?? (amount > 0 ? 'in' : 'out')),
      reason: String(body.reason ?? ''),
      reference: String(body.reference ?? ''),
    });
    console.log(`[${traceId}] cash.movement ${mv._id}`);
    return NextResponse.json({ ok: true, mv });
  } catch (err: unknown) {
    console.error(`[${traceId}] cash.movement error`, err instanceof Error ? err.message : String(err));
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : 'error' }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const traceId = req.headers.get('x-trace-id') || 'trace-missing';
  try {
    const session = await requireOperatorSession(req);
    await dbConnect();
    const items = await CashMovement.find({ storeId: session.storeId }).limit(100).sort({ createdAt: -1 }).lean<Record<string, unknown>[]>();
    return NextResponse.json({ ok: true, items });
  } catch (err: unknown) {
    console.error(`[${traceId}] cash.movement.list error`, err instanceof Error ? err.message : String(err));
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : 'error' }, { status: 400 });
  }
}
