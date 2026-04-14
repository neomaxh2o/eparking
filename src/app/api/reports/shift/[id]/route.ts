import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Shift from '@/models/Shift';
import Ticket from '@/models/Ticket';
import CashMovement from '@/models/CashMovement';
import { requireOperatorSession } from '@/lib/requireOperatorSession';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const traceId = req.headers.get('x-trace-id') || 'trace-missing';
  try {
    const session = await requireOperatorSession(req);
    await dbConnect();
    const { id } = await context.params;
    const shift = await Shift.findById(id).lean<Record<string, unknown> | null>();
    if (!shift) return NextResponse.json({ ok: false, error: 'not found' }, { status: 404 });
    const tickets = await Ticket.find({ turnoId: shift._id }).lean<Record<string, unknown>[]>();
    const movements = await CashMovement.find({ shiftId: shift._id }).lean<Record<string, unknown>[]>();
    const ticketsTotal = tickets.reduce((s, t) => s + Number((t.totalCobrado ?? 0) as number), 0);
    const movementsTotal = movements.reduce((s, m) => s + Number((m.amount ?? 0) as number), 0);
    const report = { shift, ticketsCount: tickets.length, ticketsTotal, movementsTotal };
    console.log(`[${traceId}] reports.shift ${shift._id}`);
    return NextResponse.json({ ok: true, report });
  } catch (err: unknown) {
    console.error(`[${traceId}] reports.shift error`, err instanceof Error ? err.message : String(err));
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : 'error' }, { status: 400 });
  }
}
