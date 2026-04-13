import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { cerrarTurnoPendiente } from '@/modules/turnos/server/turno.logic';
import { serializeTurno } from '@/modules/caja/server/serializers';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const operatorId = String(body?.operatorId ?? '').trim();
    const turnoId = String(body?.turnoId ?? '').trim();

    if (!operatorId || !turnoId) {
      return NextResponse.json(
        { error: 'operatorId y turnoId son requeridos' },
        { status: 400 }
      );
    }

    const turno = await cerrarTurnoPendiente(operatorId, turnoId);
    return NextResponse.json(await serializeTurno(turno), { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error cerrando subturno pendiente' },
      { status: 400 }
    );
  }
}
