import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Ticket from '@/models/Ticket';
import { requireOperatorSession } from '@/lib/requireOperatorSession';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const traceId = req.headers.get('x-trace-id') || 'trace-missing';
  try {
    const session = await requireOperatorSession(req);
    await dbConnect();
    const ticket = await Ticket.findById(params.id);
    if (!ticket) return NextResponse.json({ ok: false, error: 'not found' }, { status: 404 });
    return NextResponse.json({ ok: true, ticket });
  } catch (err: any) {
    console.error(`[${traceId}] ticket.get error`, err.message || err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
