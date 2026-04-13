import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { cerrarEstadiaYActualizarTurno } from '@/modules/caja/server/caja.logic';

export async function POST(req: Request) {
  await dbConnect();
  try {
    const body = await req.json();
    const result = await cerrarEstadiaYActualizarTurno(body);
    return NextResponse.json({ message: result.message, ticket: result.ticket });
  } catch (error) {
    console.error('❌ Error POST salida:', error);
    const message = error instanceof Error ? error.message : 'Error registrando salida';
    const status =
      message.includes('Falta ticketNumber')
        ? 400
        : message.includes('Tarifa no encontrada') || message.includes('Estadía no encontrada')
          ? 404
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
