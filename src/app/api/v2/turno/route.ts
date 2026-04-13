import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { getTurnoAbiertoByOperator } from '@/modules/turnos/server/turno.logic';
import { serializeTurno } from '@/modules/caja/server/serializers';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const operatorId = req.nextUrl.searchParams.get('operatorId');
    if (!operatorId) {
      return NextResponse.json({ error: 'operatorId es requerido' }, { status: 400 });
    }

    const turno = await getTurnoAbiertoByOperator(operatorId);
    if (!turno) {
      return NextResponse.json(null, { status: 200 });
    }

    return NextResponse.json(await serializeTurno(turno), { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error obteniendo turno' },
      { status: 500 }
    );
  }
}
