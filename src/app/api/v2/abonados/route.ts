import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Abonado from '@/models/Abonado';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { emitAbonadoInvoice, accreditBillingDocument } from '@/modules/billing';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  await dbConnect();

  const { searchParams } = new URL(req.url);
  const assignedParking = searchParams.get('assignedParking');
  const estado = searchParams.get('estado');
  const billingMode = searchParams.get('billingMode');
  const search = searchParams.get('search');
  const searchBy = searchParams.get('searchBy');

  const query: Record<string, unknown> = {};
  if (session.user.role === 'owner') {
    query.ownerId = session.user.id;
  }
  if (assignedParking) {
    query.assignedParking = assignedParking;
  }
  if (estado) {
    query.estado = estado;
  }
  if (billingMode) {
    query.billingMode = billingMode;
  }

  if (search?.trim()) {
    const term = search.trim();
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'), 'i');

    if (searchBy === 'numeroAbonado') {
      const parsed = Number(term);
      query.numeroAbonado = Number.isFinite(parsed) ? parsed : -1;
    } else if (searchBy === 'dni') {
      query.dni = regex;
    } else if (searchBy === 'nombre') {
      query.$or = [{ nombre: regex }, { apellido: regex }];
    } else if (searchBy === 'email') {
      query.email = regex;
    } else {
      const parsed = Number(term);
      query.$or = [
        { nombre: regex },
        { apellido: regex },
        { email: regex },
        { dni: regex },
        ...(Number.isFinite(parsed) ? [{ numeroAbonado: parsed }] : []),
      ];
    }
  }

  const items = await Abonado.find(query).sort({ createdAt: -1 }).lean<Record<string, unknown>[]>();
  return NextResponse.json(items, { status: 200 });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  if (!['owner', 'admin', 'operator'].includes(session.user.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  await dbConnect();
  const raw: unknown = await req.json().catch(() => null);
  const body = (raw && typeof raw === 'object') ? (raw as Record<string, unknown>) : {};
  const clientId = body.clientId as string | undefined;

  if (!clientId) {
    return NextResponse.json({ error: 'Falta clientId' }, { status: 400 });
  }

  const client = await User.findById(clientId).lean<Record<string, unknown> | null>();
  if (!client || (client.role as unknown) !== 'client') {
    return NextResponse.json({ error: 'Cliente inválido' }, { status: 400 });
  }

  const existingAbonado = await Abonado.findOne({ clientId }).lean<Record<string, unknown> | null>();
  if (existingAbonado) {
    return NextResponse.json({ error: 'El cliente seleccionado ya tiene un abonado asociado.' }, { status: 409 });
  }

  const lastAbonado = await Abonado.findOne({}, { numeroAbonado: 1 }).sort({ numeroAbonado: -1 }).lean<Record<string, unknown> | null>();
  const nextNumeroAbonado = Number((lastAbonado?.numeroAbonado ?? 0) as number) + 1;

  const abonado = await Abonado.create({
    clientId,
    numeroAbonado: nextNumeroAbonado,
    ownerId: session.user.role === 'owner' ? session.user.id : (body.ownerId as string) ?? null,
    assignedParking: body.assignedParking ?? client.assignedParking ?? null,
    estado: (body.estado as string) ?? 'activo',
    nombre: (body.nombre as string) ?? (client.nombre as string | undefined),
    apellido: (body.apellido as string) ?? (client.apellido as string | undefined),
    dni: (body.dni as string) ?? (client.dni as string | undefined),
    telefono: (body.telefono as string) ?? (client.telefono as string | undefined),
    ciudad: (body.ciudad as string) ?? (client.ciudad as string | undefined),
    domicilio: (body.domicilio as string) ?? (client.domicilio as string | undefined),
    email: (body.email as string) ?? (client.email as string | undefined),
    vehiculos: Array.isArray(body.vehiculos) ? (body.vehiculos as unknown[]) : (client.patenteVehiculo ? [{ patente: client.patenteVehiculo, modelo: client.modeloVehiculo, categoria: client.categoriaVehiculo, activo: true }] : []),
    accesos: Array.isArray(body.accesos) ? (body.accesos as unknown[]) : [],
    observaciones: (body.observaciones as string) ?? '',
    fechaVencimiento: body.fechaVencimiento ?? null,
    billingMode: (body.billingMode as string) ?? 'mensual',
    tarifaId: (body.tarifaId as string) ?? '',
    tarifaNombre: (body.tarifaNombre as string) ?? '',
    importeBase: Number(body.importeBase ?? 0),
    tarifaSnapshot: body.tarifaSnapshot ?? {},
  });

  let initialInvoice: any = null;

  if (body?.initialCharge?.enabled) {
    initialInvoice = await emitAbonadoInvoice({
      abonadoId: String(abonado._id),
      actorRole: session.user.role === 'operator' ? 'operator' : session.user.role === 'owner' ? 'owner' : 'admin',
      actorUserId: session.user.id,
      source: 'abonado',
      operatorId: session.user.role === 'operator' ? session.user.id : null,
      tipoFacturacion: body?.initialCharge?.tipoFacturacion ?? body?.billingMode ?? 'mensual',
      monto: Number(body?.initialCharge?.amount ?? body?.importeBase ?? 0),
      estado: body?.initialCharge?.markAsPaid ? 'emitida' : 'emitida',
      paymentReference: body?.initialCharge?.paymentReference ?? undefined,
    });

    if (body?.initialCharge?.markAsPaid && initialInvoice?._id) {
      const accreditResult = await accreditBillingDocument(
        {
          _id: initialInvoice._id,
          ...(session.user.role === 'owner' ? { ownerId: session.user.id } : {}),
        },
        {
          paymentMethod: body?.initialCharge?.paymentMethod ?? 'efectivo',
          paymentProvider: body?.initialCharge?.paymentProvider ?? 'manual',
          paymentReference: body?.initialCharge?.paymentReference ?? '',
        },
      );

      if ('document' in accreditResult && accreditResult.document) {
        initialInvoice = accreditResult.document;
      }
    }
  }

  return NextResponse.json({
    ...abonado.toObject(),
    initialInvoice,
  }, { status: 201 });
}
