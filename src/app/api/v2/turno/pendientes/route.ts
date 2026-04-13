import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { getTurnosPendientesByOperator } from '@/modules/turnos/server/turno.logic';
import { serializeTurno } from '@/modules/caja/server/serializers';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const operatorId = String(req.nextUrl.searchParams.get('operatorId') ?? '').trim();
    if (!operatorId) {
      return NextResponse.json({ error: 'operatorId es requerido' }, { status: 400 });
    }

    const turnos = await getTurnosPendientesByOperator(operatorId);
    const serialized = await Promise.all(turnos.map((turno) => serializeTurno(turno)));

    return NextResponse.json(serialized, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error obteniendo pendientes' },
      { status: 500 }
    );
  }
}
