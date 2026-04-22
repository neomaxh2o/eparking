import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongoose';
import Turno from '@/models/Turno';
import { getTurnoLiquidacionSnapshot } from '@/modules/admin-caja/server/admin-turno-liquidacion';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  await dbConnect();
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: 'turnoId es requerido' }, { status: 400 });
  }

  const turno = await Turno.findById(String(id)).select('_id operatorId esCajaAdministrativa');
  if (!turno) {
    return NextResponse.json({ error: 'Turno no encontrado.' }, { status: 404 });
  }

  const role = String(session.user.role ?? '');
  const isAdminTurno = Boolean(turno.esCajaAdministrativa);
  const belongsToSession = String(turno.operatorId ?? '') === session.user.id;

  if (isAdminTurno) {
    if (!['admin', 'owner'].includes(role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    if (!belongsToSession) {
      return NextResponse.json({ error: 'No autorizado para ver la liquidación de este turno.' }, { status: 403 });
    }
  } else if (!belongsToSession && !['admin', 'owner'].includes(role)) {
    return NextResponse.json({ error: 'No autorizado para ver la liquidación de este turno.' }, { status: 403 });
  }

  const liquidacion = await getTurnoLiquidacionSnapshot(String(id));
  if (!liquidacion) {
    return NextResponse.json({ error: 'Liquidación no encontrada para el turno indicado.' }, { status: 404 });
  }

  return NextResponse.json(liquidacion, { status: 200 });
}
