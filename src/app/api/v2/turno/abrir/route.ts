import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { abrirTurno } from '@/modules/turnos/server/turno.logic';
import { serializeTurno } from '@/modules/caja/server/serializers';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const operatorId = String(body?.operatorId ?? '').trim();
    const numeroCaja = Number(body?.numeroCaja ?? 1);

    if (!operatorId) {
      return NextResponse.json({ error: 'operatorId es requerido' }, { status: 400 });
    }

    const turno = await abrirTurno(operatorId, numeroCaja);
    return NextResponse.json(await serializeTurno(turno), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error abriendo turno' },
      { status: 400 }
    );
  }
}
