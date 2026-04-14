import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import { Tarifa } from '@/models/Tarifa';

// ---------------- GET por ID ----------------
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await connectToDatabase();
  const { id } = await context.params;
  const tarifa = await Tarifa.findById(id).lean<Record<string, unknown> | null>();
  if (!tarifa) {
    return NextResponse.json({ error: 'Tarifa no encontrada' }, { status: 404 });
  }
  return NextResponse.json(tarifa);
}

// ---------------- PUT editar subdocumento ----------------
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await context.params;
    const raw: unknown = await req.json().catch(() => null);
    const body = (raw && typeof raw === 'object') ? (raw as Record<string, unknown>) : {};
    const subId = String(body.subId ?? '');
    const tipo = String(body.tipo ?? '');
    const data = body.data ?? {};
    // tipo validation left to runtime

    const tarifa = await Tarifa.findById(id);
    if (!tarifa) return NextResponse.json({ error: 'Tarifa no encontrada' }, { status: 404 });

    tarifa[tipo] = (tarifa[tipo] || []).map((s: Record<string, unknown>) =>
      String(s._id) === subId ? { ...s.toObject ? (s.toObject() as Record<string, unknown>) : s, ...(data as Record<string, unknown>) } : s
    );

    await tarifa.save();
    return NextResponse.json({ success: true, tarifa });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error actualizando subdocumento' }, { status: 400 });
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
