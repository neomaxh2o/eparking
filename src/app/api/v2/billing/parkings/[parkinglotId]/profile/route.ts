import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongoose';
import ParkingLot from '@/models/ParkingLot';

function validateBillingProfile(body: unknown) {
  const b = (body && typeof body === 'object') ? (body as Record<string, unknown>) : {};
  const enabled = Boolean(b?.enabled ?? false);
  const businessName = String(b?.businessName ?? '').trim();
  const documentNumber = String(b?.documentNumber ?? '').trim();
  const pointOfSale = String(b?.pointOfSale ?? '').trim();
  const email = String(b?.email ?? '').trim();

  if (!enabled) {
    return null;
  }

  if (!businessName) {
    return 'La razón social es obligatoria cuando el perfil fiscal está habilitado.';
  }

  if (!documentNumber) {
    return 'El número fiscal es obligatorio cuando el perfil fiscal está habilitado.';
  }

  if (!pointOfSale) {
    return 'El punto de venta es obligatorio cuando el perfil fiscal está habilitado.';
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'El email fiscal no tiene un formato válido.';
  }

  const digitsOnly = documentNumber.replace(/\D/g, '');
  const documentType = String(b?.documentType ?? 'cuit');
  if (documentType === 'cuit' && digitsOnly.length !== 11) {
    return 'El CUIT debe tener 11 dígitos.';
  }

  return null;
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ parkinglotId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  if (!['admin', 'owner'].includes(session.user.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  await dbConnect();
  const { parkinglotId } = await context.params;

  const query: Record<string, unknown> = { _id: parkinglotId };
  if (session.user.role === 'owner') query.owner = session.user.id;

  const parking = await ParkingLot.findOne(query).lean<Record<string, unknown> | null>();
  if (!parking) {
    return NextResponse.json({ error: 'Playa no encontrada' }, { status: 404 });
  }

  return NextResponse.json({
    parkinglotId: String(parking._id),
    parkingName: String(parking.name ?? ''),
    billingProfile: parking.billingProfile ?? {},
  }, { status: 200 });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ parkinglotId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  if (!['admin', 'owner'].includes(session.user.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  await dbConnect();
  const { parkinglotId } = await context.params;
  const body = await req.json().catch(() => ({}));

  const validationError = validateBillingProfile(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const query: Record<string, unknown> = { _id: parkinglotId };
  if (session.user.role === 'owner') query.owner = session.user.id;

  const updated = await ParkingLot.findOneAndUpdate(
    query,
    {
      $set: {
        billingProfile: {
          enabled: Boolean((body as any)?.enabled ?? false),
          businessName: String((body as any)?.businessName ?? ''),
          taxCondition: String((body as any)?.taxCondition ?? 'consumidor_final'),
          documentType: String((body as any)?.documentType ?? 'cuit'),
          documentNumber: String((body as any)?.documentNumber ?? ''),
          pointOfSale: String((body as any)?.pointOfSale ?? ''),
          voucherTypeDefault: String((body as any)?.voucherTypeDefault ?? 'consumidor_final'),
          iibb: String((body as any)?.iibb ?? ''),
          address: String((body as any)?.address ?? ''),
          city: String((body as any)?.city ?? ''),
          email: String((body as any)?.email ?? ''),
          phone: String((body as any)?.phone ?? ''),
        },
      },
    },
    { new: true },
  ).lean<Record<string, unknown> | null>();

  if (!updated) {
    return NextResponse.json({ error: 'Playa no encontrada' }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    parkinglotId: String(updated._id),
    parkingName: String(updated.name ?? ''),
    billingProfile: updated.billingProfile ?? {},
  }, { status: 200 });
}
