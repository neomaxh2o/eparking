import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Shift from '@/models/Shift';
import { requireOperatorSession } from '@/lib/requireOperatorSession';

export async function GET(req: Request) {
  const traceId = req.headers.get('x-trace-id') || 'trace-missing';
  try {
    const session = await requireOperatorSession(req);
    await dbConnect();
    const shifts = await Shift.find({ storeId: session.storeId }).sort({ openedAt: -1 }).limit(50);
    console.log(`[${traceId}] shifts.list count=${shifts.length}`);
    return NextResponse.json({ ok: true, shifts });
  } catch (err: any) {
    console.error(`[${traceId}] shifts.list error`, err.message || err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
