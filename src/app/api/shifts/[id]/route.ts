import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Shift from '@/models/Shift';
import { requireOperatorSession } from '@/lib/requireOperatorSession';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const traceId = req.headers.get('x-trace-id') || 'trace-missing';
  try {
    const session = await requireOperatorSession(req);
    await dbConnect();
    const shift = await Shift.findById(params.id);
    if (!shift) return NextResponse.json({ ok: false, error: 'not found' }, { status: 404 });
    if (String(shift.storeId) !== String(session.storeId)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
    console.log(`[${traceId}] shifts.get ${shift._id}`);
    return NextResponse.json({ ok: true, shift });
  } catch (err: any) {
    console.error(`[${traceId}] shifts.get error`, err.message || err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const traceId = req.headers.get('x-trace-id') || 'trace-missing';
  try {
    const session = await requireOperatorSession(req);
    await dbConnect();
    const body = await req.json();
    const shift = await Shift.findById(params.id);
    if (!shift) return NextResponse.json({ ok: false, error: 'not found' }, { status: 404 });
    if (shift.status !== 'open') return NextResponse.json({ ok: false, error: 'invalid state' }, { status: 400 });
    shift.status = 'closed';
    shift.closedAt = new Date();
    shift.closedBy = session.user._id;
    shift.actualCash = body.actualCash ?? shift.expectedCash;
    await shift.save();
    console.log(`[${traceId}] shifts.close ${shift._id}`);
    return NextResponse.json({ ok: true, shift });
  } catch (err: any) {
    console.error(`[${traceId}] shifts.close error`, err.message || err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
