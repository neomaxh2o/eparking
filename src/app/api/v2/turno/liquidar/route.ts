import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { liquidarTurno } from '@/modules/turnos/server/turno.logic';
import { serializeTurno } from '@/modules/caja/server/serializers';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const operatorId = String(body?.operatorId ?? '').trim();

    if (!operatorId) {
      return NextResponse.json({ error: 'operatorId es requerido' }, { status: 400 });
    }

    const turno = await liquidarTurno(operatorId, {
      efectivo: Number(body?.efectivo ?? 0),
      tarjeta: Number(body?.tarjeta ?? 0),
      otros: Number(body?.otros ?? 0),
      observacion: typeof body?.observacion === 'string' ? body.observacion : undefined,
    });

    return NextResponse.json(await serializeTurno(turno), { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error liquidando turno' },
      { status: 400 }
    );
  }
}
