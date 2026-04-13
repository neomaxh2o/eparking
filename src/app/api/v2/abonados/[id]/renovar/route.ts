import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Abonado from '@/models/Abonado';
import AbonadoInvoice from '@/models/AbonadoInvoice';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

function addMonths(date: Date, months: number) {
  const copy = new Date(date);
  copy.setUTCMonth(copy.getUTCMonth() + months);
  return copy;
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  if (session.user.role !== 'owner' && session.user.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  await dbConnect();
  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));

  const query: Record<string, unknown> = { _id: id };
  if (session.user.role === 'owner') query.ownerId = session.user.id;

  const abonado = await Abonado.findOne(query);
  if (!abonado) {
    return NextResponse.json({ error: 'Abonado no encontrado' }, { status: 404 });
  }

  const now = new Date();
  const baseDate = abonado.fechaVencimiento ? new Date(abonado.fechaVencimiento) : now;
  const nuevaFechaVencimiento = addMonths(baseDate > now ? baseDate : now, Number(body?.meses ?? 1));
  const monto = Number(body?.monto ?? abonado.importeBase ?? 0);

  const invoice = await AbonadoInvoice.create({
    abonadoId: abonado._id,
    clientId: abonado.clientId,
    ownerId: abonado.ownerId ?? null,
    assignedParking: abonado.assignedParking ?? null,
    tarifaId: abonado.tarifaId ?? '',
    tipoFacturacion: 'mensual',
    periodoLabel: body?.periodoLabel ?? `${nuevaFechaVencimiento.getUTCFullYear()}-${String(nuevaFechaVencimiento.getUTCMonth() + 1).padStart(2, '0')}`,
    fechaEmision: now,
    fechaVencimiento: nuevaFechaVencimiento,
    estado: body?.estado ?? 'emitida',
    monto,
    moneda: body?.moneda ?? 'ARS',
    snapshot: {
      abonado: {
        nombre: abonado.nombre,
        apellido: abonado.apellido,
        email: abonado.email,
      },
      tarifaNombre: abonado.tarifaNombre ?? '',
      tarifaSnapshot: abonado.tarifaSnapshot ?? {},
      source: 'renewal',
    },
    origen: 'admin',
  });

  abonado.fechaVencimiento = nuevaFechaVencimiento;
  if (abonado.estado === 'vencido' || abonado.estado === 'suspendido') {
    abonado.estado = 'activo';
  }
  await abonado.save();

  return NextResponse.json({ abonado, invoice }, { status: 201 });
}
