import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Ticket from '@/models/Ticket';
import { requireOperatorSession } from '@/lib/requireOperatorSession';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const traceId = req.headers.get('x-trace-id') || 'trace-missing';
  try {
    const session = await requireOperatorSession(req);
    await dbConnect();
    const { id } = await context.params;
    const ticket = await Ticket.findById(id).lean<Record<string, unknown> | null>();
    if (!ticket) return NextResponse.json({ ok: false, error: 'not found' }, { status: 404 });
    return NextResponse.json({ ok: true, ticket });
  } catch (err: unknown) {
    console.error(`[${traceId}] ticket.get error`, err instanceof Error ? err.message : String(err));
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : 'error' }, { status: 400 });
  }
}
