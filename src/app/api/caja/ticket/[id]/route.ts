import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Estadia from '@/models/Estadia';
import { serializeEstadiaAsTicket } from '@/modules/tickets/server/serializers';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await connectToDatabase();

    const estadia = await Estadia.findOne({ ticket: params.id });

    if (!estadia) {
      return NextResponse.json({ message: 'Ticket no encontrado' }, { status: 404 });
    }

    return NextResponse.json(serializeEstadiaAsTicket(estadia), { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
