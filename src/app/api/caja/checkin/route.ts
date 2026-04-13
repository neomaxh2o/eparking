import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Estadia from '@/models/Estadia';
import Turno from '@/models/Turno';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const { operadorId, playaId, ticketNumber, patente, categoria, tipoEstadia, tarifaId } = body;

    // Validaciones mínimas
    if (!operadorId || !playaId) {
      return NextResponse.json({ error: 'Faltan datos de operador o playa' }, { status: 400 });
    }

    // Verificar que el operador existe y tiene rol 'operator'
    const user = await User.findOne({ _id: operadorId, role: 'operator' });
    if (!user) return NextResponse.json({ error: 'Operador no encontrado o rol inválido' }, { status: 404 });

    // Verificar turno activo
    const turno = await Turno.findOne({ operadorId, playaId, estado: 'abierto' });
    if (!turno) return NextResponse.json({ error: 'No hay turno activo', status: 403 });

    // Crear estadía mínima
    const nuevaEstadia = new Estadia({
      ticketNumber: ticketNumber || `RAP-${Date.now()}`,
      patente: patente || '---',
      categoria: categoria || 'Otros',
      tipoEstadia: tipoEstadia || 'libre',
      tarifaId: tarifaId || process.env.DEFAULT_TARIFA_ID,
      operadorId,
      playaId,
      horaEntrada: new Date(),
    });

    await nuevaEstadia.save();
    return NextResponse.json(nuevaEstadia, { status: 201 });

  } catch (error: any) {
    console.error('Error en checkin:', error);
    return NextResponse.json({ error: 'Error al crear la estadía', details: error.message }, { status: 500 });
  }
}
