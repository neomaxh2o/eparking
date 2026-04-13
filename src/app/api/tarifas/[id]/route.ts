import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import { Tarifa } from '@/models/Tarifa';

// ---------------- GET por ID ----------------
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await connectToDatabase();
  const tarifa = await Tarifa.findById(params.id);
  if (!tarifa) {
    return NextResponse.json({ error: 'Tarifa no encontrada' }, { status: 404 });
  }
  return NextResponse.json(tarifa);
}

// ---------------- PUT editar subdocumento ----------------
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { subId, tipo, data } = body; 
    // tipo = 'tarifasHora' | 'tarifasPorDia' | 'tarifaMensual' | 'tarifaLibre'

    const tarifa = await Tarifa.findById(params.id);
    if (!tarifa) return NextResponse.json({ error: 'Tarifa no encontrada' }, { status: 404 });

    tarifa[tipo] = tarifa[tipo].map((s: any) =>
      s._id.toString() === subId ? { ...s.toObject(), ...data } : s
    );

    await tarifa.save();
    return NextResponse.json({ success: true, tarifa });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error actualizando subdocumento' }, { status: 400 });
  }
}

// ---------------- DELETE subdocumento ----------------
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { subId, tipo } = body;

    const tarifa = await Tarifa.findById(params.id);
    if (!tarifa) return NextResponse.json({ error: 'Tarifa no encontrada' }, { status: 404 });

    tarifa[tipo] = tarifa[tipo].filter((s: any) => s._id.toString() !== subId);
    await tarifa.save();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error eliminando subdocumento' }, { status: 400 });
  }
}
