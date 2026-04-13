// app/api/estadias/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Estadia from '@/models/Estadia';
import { Types } from 'mongoose';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await connectToDatabase();

  const { id } = params;
  if (!id) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  try {
    const body = await req.json();
    const updated = await Estadia.findByIdAndUpdate(id, body, { new: true });
    if (!updated) return NextResponse.json({ error: 'Estadía no encontrada' }, { status: 404 });

    return NextResponse.json(updated, { status: 200 });
  } catch (err: any) {
    console.error('Error PATCH /api/estadias/[id]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await connectToDatabase();

  const { id } = params;
  if (!id) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  try {
    const estadia = await Estadia.findById(id);
    if (!estadia) return NextResponse.json({ error: 'Estadía no encontrada' }, { status: 404 });

    return NextResponse.json(estadia, { status: 200 });
  } catch (err: any) {
    console.error('Error GET /api/estadias/[id]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
