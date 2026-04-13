// app/api/caja/turno/liquidar/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Turno from '@/models/Turno';

export async function POST(req: Request) {
  await dbConnect();

  try {
    const { operatorId, efectivo, tarjeta, otros } = await req.json();

    if (!operatorId) {
      return NextResponse.json({ error: 'Falta operatorId' }, { status: 400 });
    }

    // Validar que exista un turno abierto para este operador
    const turnoAbierto = await Turno.findOne({ operatorId, estado: 'abierto' });
    if (!turnoAbierto) {
      return NextResponse.json(
        { error: 'No hay un turno abierto para este operador.' },
        { status: 404 }
      );
    }

    // Calcular total declarado
    const totalDeclarado = (efectivo || 0) + (tarjeta || 0) + (otros || 0);

    // Guardar liquidación en el turno
    turnoAbierto.liquidacion = {
      efectivo: efectivo || 0,
      tarjeta: tarjeta || 0,
      otros: otros || 0,
      totalDeclarado,
      fechaLiquidacion: new Date(),
    };

    await turnoAbierto.save();

    return NextResponse.json(turnoAbierto);
  } catch (error) {
    console.error('Error al liquidar turno:', error);
    return NextResponse.json({ error: 'Error al liquidar turno' }, { status: 500 });
  }
}
