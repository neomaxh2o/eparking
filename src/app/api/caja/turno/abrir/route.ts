import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Turno from '@/models/Turno';
import { ensureTurnoIdentity } from '@/lib/caja/turnoIdentity';

export async function POST(req: Request) {
  await dbConnect();

  try {
    const body = await req.json();
    const operatorId = body?.operatorId;
    const operatorName = body?.operatorName?.trim?.() || '';
    const cajaNumero = Number(body?.cajaNumero ?? 1);

    if (!operatorId) {
      return NextResponse.json({ error: 'Falta operatorId' }, { status: 400 });
    }

    if (!Number.isInteger(cajaNumero) || cajaNumero <= 0) {
      return NextResponse.json({ error: 'cajaNumero inválido' }, { status: 400 });
    }

    const turnoAbierto = await Turno.findOne({ operatorId, estado: 'abierto' });
    if (turnoAbierto) {
      return NextResponse.json(
        {
          error:
            'Ya existe un turno abierto para este operador. Debe cerrarse antes de abrir uno nuevo.',
        },
        { status: 400 }
      );
    }

    const { numeroTurno, subturnoNumero, codigoTurno } = await ensureTurnoIdentity(
      operatorId,
      cajaNumero,
      0
    );

    const turno = new Turno({
      operatorId,
      operatorName,
      estado: 'abierto',
      totalTurno: 0,
      tickets: [],
      fechaApertura: new Date(),

      // compatibilidad
      numeroCaja: cajaNumero,

      // nueva identidad
      cajaNumero,
      numeroTurno,
      subturnoNumero,
      codigoTurno,
    });

    await turno.save();

    return NextResponse.json(turno);
  } catch (error) {
    console.error('❌ Error al abrir turno:', error);
    return NextResponse.json({ error: 'Error al abrir turno' }, { status: 500 });
  }
}
