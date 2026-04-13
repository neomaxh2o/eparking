import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { cerrarSubturno } from '@/modules/turnos/server/turno.logic';
import { serializeTurno } from '@/modules/caja/server/serializers';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const operatorId = String(body?.operatorId ?? '').trim();

    if (!operatorId) {
      return NextResponse.json({ error: 'operatorId es requerido' }, { status: 400 });
    }

    const turno = await cerrarSubturno(operatorId);

    return NextResponse.json(
      {
        cerradoOperativamente: await serializeTurno(turno),
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error cerrando subturno' },
      { status: 400 }
    );
  }
}
