import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongoose';
import ParkingLot from '@/models/ParkingLot';
import User from '@/models/User';
import { assertCanRunZetaClosure, closeBillingZeta } from '@/modules/billing';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const actorRole = session.user.role === 'admin' ? 'admin' : session.user.role === 'owner' ? 'owner' : session.user.role === 'operator' ? 'operator' : 'system';

  try {
    assertCanRunZetaClosure(actorRole);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'No autorizado' }, { status: 403 });
  }

  await dbConnect();
  const body = await req.json().catch(() => ({}));

  let effectiveParkinglotId: string | null = body?.parkinglotId ?? null;
  let effectiveOwnerId: string | null = session.user.role === 'owner' ? session.user.id : body?.ownerId ?? null;

  let scopedParking: any = null;

  if (session.user.role === 'owner') {
    if (effectiveParkinglotId) {
      scopedParking = await ParkingLot.findOne({ _id: effectiveParkinglotId, owner: session.user.id }).lean();
      if (!scopedParking) {
        return NextResponse.json({ error: 'La playa indicada no pertenece al owner logueado.' }, { status: 403 });
      }
    }
  } else if (effectiveParkinglotId) {
    scopedParking = await ParkingLot.findById(effectiveParkinglotId).lean();
  }

  if (session.user.role === 'operator') {
    const operator = await User.findById(session.user.id).lean();
    const assignedParking = operator?.assignedParking ? String(operator.assignedParking) : null;
    if (!assignedParking) {
      return NextResponse.json({ error: 'El operador no tiene una playa asignada.' }, { status: 400 });
    }
    effectiveParkinglotId = assignedParking;
    effectiveOwnerId = null;
    scopedParking = await ParkingLot.findById(assignedParking).lean();
  }

  if (effectiveParkinglotId) {
    const billingProfile = scopedParking?.billingProfile ?? null;
    const isBillingProfileValid = Boolean(
      billingProfile?.enabled &&
      String(billingProfile?.businessName ?? '').trim() &&
      String(billingProfile?.documentNumber ?? '').trim() &&
      String(billingProfile?.pointOfSale ?? '').trim(),
    );

    if (!isBillingProfileValid) {
      return NextResponse.json(
        { error: 'La playa seleccionada no tiene un perfil fiscal válido para ejecutar cierre Z.' },
        { status: 400 },
      );
    }
  }

  try {
    const closure = await closeBillingZeta({
      actorRole,
      actorUserId: session.user.id,
      ownerId: effectiveOwnerId,
      parkinglotId: effectiveParkinglotId,
      cajaNumero: body?.cajaNumero ?? null,
      from: body?.from ?? null,
      to: body?.to ?? null,
    });

    return NextResponse.json(closure, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'No se pudo ejecutar el cierre Z.' }, { status: 400 });
  }
}
