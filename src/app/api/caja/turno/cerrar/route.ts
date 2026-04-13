// app/api/caja/turno/cerrar/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Turno from '@/models/Turno';

export async function POST(req: Request) {
  await dbConnect();

  try {
    const { operatorId } = await req.json();
    if (!operatorId) {
      return NextResponse.json({ error: 'Falta operatorId' }, { status: 400 });
    }

    // Buscar turno abierto del operador
    const turnoAbierto = await Turno.findOne({ estado: 'abierto', operatorId });
    if (!turnoAbierto) {
      return NextResponse.json({ error: 'No hay turno abierto para este operador' }, { status: 404 });
    }

    // Cerrar turno
    turnoAbierto.fechaCierre = new Date();
    turnoAbierto.estado = 'cerrado';
    await turnoAbierto.save();

    return NextResponse.json(turnoAbierto);
  } catch (error) {
    console.error('Error cerrar turno:', error);
    return NextResponse.json({ error: 'Error al cerrar turno' }, { status: 500 });
  }
}
