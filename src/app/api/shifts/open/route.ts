import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Shift from '@/models/Shift';
import { requireOperatorSession } from '@/lib/requireOperatorSession';

export async function POST(req: Request) {
  const traceId = req.headers.get('x-trace-id') || 'trace-missing';
  try {
    const session = await requireOperatorSession(req);
    await dbConnect();
    const body = await req.json();
    const shift = await Shift.create({
      storeId: body.storeId || session.storeId,
      openedBy: session.user._id,
      startingCash: body.startingCash || 0,
      notes: body.notes || ''
    });
    console.log(`[${traceId}] shift.open created ${shift._id}`);
    return NextResponse.json({ ok: true, shift });
  } catch (err: any) {
    console.error(`[${traceId}] shift.open error`, err.message || err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
