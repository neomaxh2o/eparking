import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongoose';
import Abonado from '@/models/Abonado';
import AbonadoInvoice from '@/models/AbonadoInvoice';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  if (session.user.role !== 'client') {
    return NextResponse.json({ error: 'No autorizado para panel cliente' }, { status: 403 });
  }

  await dbConnect();

  const abonado = await Abonado.findOne({ clientId: session.user.id })
    .sort({ createdAt: -1 })
    .populate('assignedParking', '_id name')
    .lean();

  if (!abonado) {
    return NextResponse.json(null, { status: 200 });
  }

  const invoices = await AbonadoInvoice.find({ abonadoId: abonado._id }).lean();
  const hasDebt = invoices.some((invoice: any) => ['emitida', 'pendiente', 'vencida'].includes(invoice.estado));
  const hasOverdueDebt = invoices.some((invoice: any) => invoice.estado === 'vencida');

  return NextResponse.json(
    {
      id: String(abonado._id),
      clientId: String(abonado.clientId),
      estado: abonado.estado,
      nombre: abonado.nombre ?? '',
      apellido: abonado.apellido ?? '',
      dni: abonado.dni ?? '',
      telefono: abonado.telefono ?? '',
      ciudad: abonado.ciudad ?? '',
      domicilio: abonado.domicilio ?? '',
      email: abonado.email ?? '',
      vehiculos: Array.isArray(abonado.vehiculos) ? abonado.vehiculos : [],
      accesos: Array.isArray(abonado.accesos) ? abonado.accesos : [],
      observaciones: abonado.observaciones ?? '',
      fechaAlta: abonado.fechaAlta ?? null,
      fechaVencimiento: abonado.fechaVencimiento ?? null,
      billingMode: abonado.billingMode ?? 'mensual',
      tarifaId: abonado.tarifaId ?? '',
      tarifaNombre: abonado.tarifaNombre ?? '',
      importeBase: Number(abonado.importeBase ?? 0),
      assignedParking:
        abonado.assignedParking && typeof abonado.assignedParking === 'object'
          ? {
              _id: String((abonado.assignedParking as any)._id ?? ''),
              name: String((abonado.assignedParking as any).name ?? ''),
            }
          : null,
      financialStatus: hasOverdueDebt ? 'moroso' : hasDebt ? 'con_deuda' : 'al_dia',
      hasDebt,
      hasOverdueDebt,
    },
    { status: 200 },
  );
}
