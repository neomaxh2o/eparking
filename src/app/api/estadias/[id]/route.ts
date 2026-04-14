// app/api/estadias/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Estadia from '@/models/Estadia';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await connectToDatabase();

  const { id } = params;
  if (!id) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  try {
    const body: unknown = await req.json().catch(() => ({}));
    const payload = (body && typeof body === 'object') ? (body as Record<string, unknown>) : {};
    const updated = await Estadia.findByIdAndUpdate(id, payload, { new: true }).lean<Record<string, unknown> | null>();
    if (!updated) return NextResponse.json({ error: 'Estadía no encontrada' }, { status: 404 });

    return NextResponse.json(updated, { status: 200 });
  } catch (err: unknown) {
    console.error('Error PATCH /api/estadias/[id]:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'error interno' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await connectToDatabase();

  const { id } = params;
  if (!id) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  try {
    const estadia = await Estadia.findById(id).lean<Record<string, unknown> | null>();
    if (!estadia) return NextResponse.json({ error: 'Estadía no encontrada' }, { status: 404 });

    return NextResponse.json(estadia, { status: 200 });
  } catch (err: unknown) {
    console.error('Error GET /api/estadias/[id]:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'error interno' }, { status: 500 });
  }
}
