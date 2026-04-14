import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Shift from '@/models/Shift';
import { requireOperatorSession } from '@/lib/requireOperatorSession';

import { NextRequest } from 'next/server';
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const traceId = req.headers.get('x-trace-id') || 'trace-missing';
  try {
    const session = await requireOperatorSession(req);
    await dbConnect();
    const { id } = await context.params;
    const shift = await Shift.findById(id).lean<Record<string, unknown> | null>();
    if (!shift) return NextResponse.json({ ok: false, error: 'not found' }, { status: 404 });
    if (String(shift.storeId) !== String(session.storeId)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
    console.log(`[${traceId}] shifts.get ${shift._id}`);
    return NextResponse.json({ ok: true, shift });
  } catch (err: unknown) {
    console.error(`[${traceId}] shifts.get error`, err instanceof Error ? err.message : String(err));
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : 'error' }, { status: 400 });
  }
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const traceId = req.headers.get('x-trace-id') || 'trace-missing';
  try {
    const session = await requireOperatorSession(req);
    await dbConnect();
    const { id } = await context.params;
    const raw: unknown = await req.json().catch(() => null);
    const body = (raw && typeof raw === 'object') ? (raw as Record<string, unknown>) : {};
    const shift = await Shift.findById(id);
    if (!shift) return NextResponse.json({ ok: false, error: 'not found' }, { status: 404 });
    if (shift.status !== 'open') return NextResponse.json({ ok: false, error: 'invalid state' }, { status: 400 });
    shift.status = 'closed';
    shift.closedAt = new Date();
    shift.closedBy = session.user._id;
    shift.actualCash = (body.actualCash as number | undefined) ?? shift.expectedCash;
    await shift.save();
    console.log(`[${traceId}] shifts.close ${shift._id}`);
    return NextResponse.json({ ok: true, shift });
  } catch (err: unknown) {
    console.error(`[${traceId}] shifts.close error`, err instanceof Error ? err.message : String(err));
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : 'error' }, { status: 400 });
  }
}
