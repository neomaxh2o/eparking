import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose'; // Ajustar ruta
import { Novedad } from '@/models/Novedad';
import mongoose from 'mongoose';

await connectToDatabase();

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const novedad = await Novedad.findById(id);
    if (!novedad) {
      return NextResponse.json({ error: 'Novedad no encontrada' }, { status: 404 });
    }

    return NextResponse.json(novedad);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener novedad' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();

    const updated = await Novedad.findByIdAndUpdate(id, body, { new: true });
    if (!updated) {
      return NextResponse.json({ error: 'Novedad no encontrada' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar novedad' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const deleted = await Novedad.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Novedad no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Novedad eliminada correctamente' });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar novedad' }, { status: 500 });
  }
}
