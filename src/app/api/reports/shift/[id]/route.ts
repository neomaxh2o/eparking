import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Shift from '@/models/Shift';
import Ticket from '@/models/Ticket';
import CashMovement from '@/models/CashMovement';
import { requireOperatorSession } from '@/lib/requireOperatorSession';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const traceId = req.headers.get('x-trace-id') || 'trace-missing';
  try {
    const session = await requireOperatorSession(req);
    await dbConnect();
    const shift = await Shift.findById(params.id);
    if (!shift) return NextResponse.json({ ok: false, error: 'not found' }, { status: 404 });
    const tickets = await Ticket.find({ turnoId: shift._id });
    const movements = await CashMovement.find({ shiftId: shift._id });
    const report = { shift, ticketsCount: tickets.length, ticketsTotal: tickets.reduce((s:any,t:any)=>s+(t.totalCobrado||0),0), movementsTotal: movements.reduce((s:any,m:any)=>s+(m.amount||0),0) };
    console.log(`[${traceId}] reports.shift ${shift._id}`);
    return NextResponse.json({ ok: true, report });
  } catch (err: any) {
    console.error(`[${traceId}] reports.shift error`, err.message || err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
