import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Estadia from '@/models/Estadia';
import '@/models/Tarifa';

export async function GET() {
  try {
    await connectToDatabase();

    const estadias = await Estadia.find()
      .populate('tarifaId')
      .sort({ horaEntrada: -1 });

    return NextResponse.json(estadias, { status: 200 });
  } catch (error) {
    console.error('❌ Error al obtener estadías:', error);
    return NextResponse.json({ error: 'Error al obtener estadías' }, { status: 500 });
  }
}
