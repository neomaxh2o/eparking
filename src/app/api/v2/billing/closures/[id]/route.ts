import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongoose';
import BillingClosure from '@/models/BillingClosure';
import AbonadoInvoice from '@/models/AbonadoInvoice';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  if (session.user.role !== 'admin' && session.user.role !== 'owner') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  await dbConnect();
  const closure = await BillingClosure.findById(params.id).lean();
  if (!closure) {
    return NextResponse.json({ error: 'Cierre no encontrado' }, { status: 404 });
  }

  if (session.user.role === 'owner' && closure.ownerId && String(closure.ownerId) !== session.user.id) {
    return NextResponse.json({ error: 'No autorizado para ver este cierre' }, { status: 403 });
  }

  const documents = await AbonadoInvoice.find({ billingClosureId: closure._id }).lean();

  return NextResponse.json({
    ...closure,
    documents,
  }, { status: 200 });
}
