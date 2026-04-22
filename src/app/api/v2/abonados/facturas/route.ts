import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { listBillingDocuments } from '@/modules/billing';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  if (session.user.role !== 'owner' && session.user.role !== 'admin' && session.user.role !== 'operator') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  await dbConnect();
  const url = new URL(req.url);
  const abonadoId = url.searchParams.get('abonadoId');
  const estado = url.searchParams.get('estado');
  const sourceType = url.searchParams.get('sourceType');
  const parkinglotId = url.searchParams.get('parkinglotId');

  const query: Record<string, unknown> = {};
  if (abonadoId) query.abonadoId = abonadoId;
  if (estado) query.estado = estado;
  if (sourceType) query.sourceType = sourceType;
  if (parkinglotId) query.assignedParking = parkinglotId;
  if (session.user.role === 'owner') query.ownerId = session.user.id;

  const normalized = await listBillingDocuments(query);
  return NextResponse.json(normalized, { status: 200 });
}
