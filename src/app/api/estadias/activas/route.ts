import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Estadia from '@/models/Estadia';

export async function GET() {
  await connectToDatabase();

  try {
    const estadiasActivas = await Estadia.find({ estado: 'activa' })
      .sort({ createdAt: -1 })
      .lean<Record<string, unknown>[]>();

    return NextResponse.json(estadiasActivas, { status: 200 });
  } catch (err: unknown) {
    console.error('Error API /estadias/activas:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'error interno' }, { status: 500 });
  }
}
