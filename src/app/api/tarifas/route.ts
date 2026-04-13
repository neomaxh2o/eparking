import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import { Tarifa } from '@/models/Tarifa';

// ✅ GET todas las tarifas
export async function GET() {
  await connectToDatabase();
  const tarifas = await Tarifa.find();
  return NextResponse.json(tarifas);
}

// ✅ POST crear una nueva tarifa
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const data = await req.json();
    const nuevaTarifa = await Tarifa.create(data);
    return NextResponse.json(nuevaTarifa, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error creando tarifa' },
      { status: 400 }
    );
  }
}
