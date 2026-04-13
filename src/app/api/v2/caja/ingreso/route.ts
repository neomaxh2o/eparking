import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { registrarIngreso } from '@/modules/caja/server/caja.logic';
import { serializeTicketEntity } from '@/modules/tickets/server/serializers';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const operatorId = String(body?.operatorId ?? '').trim();
    const patente = String(body?.patente ?? '').trim().toUpperCase();

    if (!operatorId) {
      return NextResponse.json({ error: 'operatorId es requerido' }, { status: 400 });
    }

    if (!patente) {
      return NextResponse.json({ error: 'patente es requerida' }, { status: 400 });
    }

    const ticket = await registrarIngreso({
      operatorId,
      patente,
      categoria: body?.categoria ?? 'Automóvil',
      cliente: body?.cliente,
      tarifaId: body?.tarifaId,
      tipoEstadia: body?.tipoEstadia ?? 'libre',
      cantidad: typeof body?.cantidad === 'number' ? body.cantidad : undefined,
      prepago: Boolean(body?.prepago),
      horaEntrada: body?.horaEntrada,
    });

    return NextResponse.json({ ticket: serializeTicketEntity(ticket) }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error registrando ingreso' },
      { status: 400 }
    );
  }
}
