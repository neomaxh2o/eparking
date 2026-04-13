import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Ticket from '@/models/Ticket';
import Shift from '@/models/Shift';
import { requireOperatorSession } from '@/lib/requireOperatorSession';

export async function POST(req: Request) {
  const traceId = req.headers.get('x-trace-id') || 'trace-missing';
  try {
    const session = await requireOperatorSession(req);
    await dbConnect();
    const body = await req.json();
    if (!body.total || body.total < 0) throw new Error('invalid total');
    // attach to open shift
    const shift = await Shift.findOne({ storeId: session.storeId, status: 'open' });
    const ticket = await Ticket.create({
      turnoId: shift?._id,
      storeId: session.storeId,
      createdBy: session.user._id,
      totalCobrado: body.total,
      metodoPago: body.paymentMethod || 'efectivo',
      notas: body.notes || '',
      ticketNumber: body.ticketNumber || `T-${Date.now()}`,
      patente: body.patente || 'UNKNOWN',
      horaEntrada: new Date(),
      estado: 'cerrada',
    } as any);
    if (shift) {
      shift.ticketsCount = (shift.ticketsCount || 0) + 1;
      shift.ticketsTotal = (shift.ticketsTotal || 0) + (body.total || 0);
      await shift.save();
    }
    console.log(`[${traceId}] ticket.create ${ticket._id}`);
    return NextResponse.json({ ok: true, ticket });
  } catch (err: any) {
    console.error(`[${traceId}] ticket.create error`, err.message || err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
