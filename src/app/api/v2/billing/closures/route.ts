import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongoose';
import { listBillingClosures } from '@/modules/billing';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  if (session.user.role !== 'admin' && session.user.role !== 'owner') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  await dbConnect();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const parkinglotId = searchParams.get('parkinglotId');
  const cajaNumero = searchParams.get('cajaNumero');

  const query: Record<string, unknown> = {};
  if (session.user.role === 'owner') query.ownerId = session.user.id;
  if (type) query.type = type;
  if (parkinglotId) query.assignedParking = parkinglotId;
  if (cajaNumero) query.cajaNumero = Number(cajaNumero);

  const closures = await listBillingClosures(query);
  return NextResponse.json(closures, { status: 200 });
}
