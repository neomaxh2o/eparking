import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { getTurnoLiquidacionSnapshot } from '@/modules/admin-caja/server/admin-turno-liquidacion';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: 'turnoId es requerido' }, { status: 400 });
  }

  const liquidacion = await getTurnoLiquidacionSnapshot(String(id));
  if (!liquidacion) {
    return NextResponse.json({ error: 'Liquidación no encontrada para el turno indicado.' }, { status: 404 });
  }

  return NextResponse.json(liquidacion, { status: 200 });
}
