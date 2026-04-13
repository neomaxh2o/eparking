import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongoose';
import ParkingLot from '@/models/ParkingLot';

function validateBillingProfile(body: any) {
  const enabled = Boolean(body?.enabled ?? false);
  const businessName = String(body?.businessName ?? '').trim();
  const documentNumber = String(body?.documentNumber ?? '').trim();
  const pointOfSale = String(body?.pointOfSale ?? '').trim();
  const email = String(body?.email ?? '').trim();

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
  const documentType = String(body?.documentType ?? 'cuit');
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

  const parking = await ParkingLot.findOne(query).lean();
  if (!parking) {
    return NextResponse.json({ error: 'Playa no encontrada' }, { status: 404 });
  }

  return NextResponse.json({
    parkinglotId: String((parking as any)._id),
    parkingName: String((parking as any).name ?? ''),
    billingProfile: (parking as any).billingProfile ?? {},
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
          enabled: Boolean(body?.enabled ?? false),
          businessName: String(body?.businessName ?? ''),
          taxCondition: String(body?.taxCondition ?? 'consumidor_final'),
          documentType: String(body?.documentType ?? 'cuit'),
          documentNumber: String(body?.documentNumber ?? ''),
          pointOfSale: String(body?.pointOfSale ?? ''),
          voucherTypeDefault: String(body?.voucherTypeDefault ?? 'consumidor_final'),
          iibb: String(body?.iibb ?? ''),
          address: String(body?.address ?? ''),
          city: String(body?.city ?? ''),
          email: String(body?.email ?? ''),
          phone: String(body?.phone ?? ''),
        },
      },
    },
    { new: true },
  ).lean();

  if (!updated) {
    return NextResponse.json({ error: 'Playa no encontrada' }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    parkinglotId: String((updated as any)._id),
    parkingName: String((updated as any).name ?? ''),
    billingProfile: (updated as any).billingProfile ?? {},
  }, { status: 200 });
}
