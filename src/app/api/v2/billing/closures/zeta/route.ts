import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongoose';
import ParkingLot from '@/models/ParkingLot';
import User from '@/models/User';
import { assertCanRunZetaClosure, closeBillingZeta } from '@/modules/billing';

type BillingProfileInput = {
  enabled?: boolean;
  businessName?: string;
  documentNumber?: string;
  pointOfSale?: string;
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const actorRole = session.user.role === 'admin' ? 'admin' : session.user.role === 'owner' ? 'owner' : session.user.role === 'operator' ? 'operator' : 'system';

  try {
    assertCanRunZetaClosure(actorRole);
  } catch (error: unknown) {
    return NextResponse.json({ error: (error instanceof Error && error.message) ? error.message : 'No autorizado' }, { status: 403 });
  }

  await dbConnect();
  const body: unknown = await req.json().catch(() => null);
  const b = (body && typeof body === 'object') ? (body as Record<string, unknown>) : {};

  let effectiveParkinglotId: string | null = b?.parkinglotId ? String(b.parkinglotId) : null;
  let effectiveOwnerId: string | null = session.user.role === 'owner' ? session.user.id : b?.ownerId ? String(b.ownerId) : null;

  let scopedParking: Record<string, unknown> | null = null;

  if (session.user.role === 'owner') {
    if (effectiveParkinglotId) {
      scopedParking = await ParkingLot.findOne({ _id: effectiveParkinglotId, owner: session.user.id }).lean<Record<string, unknown> | null>();
      if (!scopedParking) {
        return NextResponse.json({ error: 'La playa indicada no pertenece al owner logueado.' }, { status: 403 });
      }
    }
  } else if (effectiveParkinglotId) {
    scopedParking = await ParkingLot.findById(effectiveParkinglotId).lean<Record<string, unknown> | null>();
  }

  if (session.user.role === 'operator') {
    const operator = await User.findById(session.user.id).lean<Record<string, unknown> | null>();
    const assignedParking = operator?.assignedParking ? String(operator.assignedParking) : null;
    if (!assignedParking) {
      return NextResponse.json({ error: 'El operador no tiene una playa asignada.' }, { status: 400 });
    }
    effectiveParkinglotId = assignedParking;
    effectiveOwnerId = null;
    scopedParking = await ParkingLot.findById(assignedParking).lean<Record<string, unknown> | null>();
  }

  if (effectiveParkinglotId) {
    const billingProfile = (scopedParking?.billingProfile && typeof scopedParking.billingProfile === 'object')
      ? (scopedParking.billingProfile as BillingProfileInput)
      : null;
    const isBillingProfileValid = Boolean(
      billingProfile &&
      billingProfile.enabled &&
      String(billingProfile.businessName ?? '').trim() &&
      String(billingProfile.documentNumber ?? '').trim() &&
      String(billingProfile.pointOfSale ?? '').trim(),
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
      cajaNumero: typeof b.cajaNumero === 'number' ? b.cajaNumero : null,
      from: typeof b.from === 'string' || b.from instanceof Date ? b.from : null,
      to: typeof b.to === 'string' || b.to instanceof Date ? b.to : null,
    });

    return NextResponse.json(closure, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error instanceof Error && error.message) ? error.message : 'No se pudo ejecutar el cierre Z.' }, { status: 400 });
  }
}
