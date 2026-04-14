import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongoose';
import Turno from '@/models/Turno';
import CashMovement from '@/models/CashMovement';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  try {
    await dbConnect();
    const rawBody: unknown = await req.json().catch(() => null);
    const b = (rawBody && typeof rawBody === 'object') ? (rawBody as Record<string, unknown>) : {};
    const turnoId = b.turnoId as string | undefined;
    const amount = b.amount as unknown;
    const bodyStoreId = b.storeId as string | undefined;

    if (!turnoId) return NextResponse.json({ error: 'turnoId requerido' }, { status: 400 });
    const monto = Number(amount ?? 0);
    if (!Number.isFinite(monto) || monto <= 0) return NextResponse.json({ error: 'amount invalido' }, { status: 400 });

    const turno = await Turno.findById(turnoId).lean<Record<string, unknown> | null>();
    if (!turno) return NextResponse.json({ error: 'turno no encontrado' }, { status: 404 });

    // Permisos: operator asociado o admin/owner
    const role = session.user.role;
    const userId = session.user.id;
    const turnoOperatorId = String((turno as Record<string, unknown>).operatorId ?? '');
    if (role !== 'admin' && role !== 'owner' && String(userId) !== turnoOperatorId) {
      return NextResponse.json({ error: 'No autorizado para registrar cobro en este turno' }, { status: 403 });
    }

    const storeId = bodyStoreId ?? (turno as Record<string, unknown>).assignedParking ?? null;
    if (!storeId) return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });

    const movement = await CashMovement.create({
      shiftId: turno._id,
      storeId: storeId,
      createdBy: userId,
      createdAt: new Date(),
      type: 'in',
      amount: monto,
      direction: 'in',
      reason: 'Cobro de prueba',
      reference: 'manual-test',
    });

    return NextResponse.json({ ok: true, movement }, { status: 201 });
  } catch (e: unknown) {
    console.error('[test/charge] error', e instanceof Error ? e.message : String(e));
    return NextResponse.json({ error: e instanceof Error ? e.message : 'error' }, { status: 500 });
  }
}
