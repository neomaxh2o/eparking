import { NextRequest, NextResponse } from 'next/server';
import mongoose, { FilterQuery } from 'mongoose';
import Estadia, { IEstadia } from '@/models/Estadia';
import Plaza, { IPlaza } from '@/models/Plaza/Plaza';
import connectToDatabase from '@/lib/mongoose';

async function ensureDbConnection() {
  if (mongoose.connection.readyState === 0) {
    await connectToDatabase();
  }
}

function isValidObjectId(value: unknown) {
  return typeof value === 'string' && mongoose.Types.ObjectId.isValid(value);
}

function toObjectId(value: unknown, field: string) {
  if (!isValidObjectId(value)) {
    throw new Error(`${field} inválido`);
  }
  return new mongoose.Types.ObjectId(String(value));
}

async function assignAvailableSubplaza(data: Partial<IEstadia>) {
  if (!data.tipoEstadia) {
    return { plazaAsignadaId: data.plazaAsignadaId, subplazaAsignadaNumero: data.subplazaAsignadaNumero };
  }

  const plaza: IPlaza | null = await Plaza.findOne({
    categoria: data.tipoEstadia,
    'plazasFisicas.estado': 'disponible',
  }).lean<IPlaza | null>();

  if (!plaza) {
    return { plazaAsignadaId: undefined, subplazaAsignadaNumero: undefined };
  }

  // plaza obtained via lean is plain object — mutate via model fetch instead when saving
  const plazaModel = await Plaza.findById(plaza._id);
  if (!plazaModel) return { plazaAsignadaId: undefined, subplazaAsignadaNumero: undefined };

  const subplaza = plazaModel.plazasFisicas.find((sp) => sp.estado === 'disponible');
  if (!subplaza) {
    return { plazaAsignadaId: undefined, subplazaAsignadaNumero: undefined };
  }

  subplaza.estado = 'ocupada';
  if (data.tipoEstadia === 'libre') {
    subplaza.usuarioAbonado = {
      ticketNumber: data.ticket ?? '',
      patente: data.patente ?? '',
    };
  }

  await plazaModel.save();

  return {
    plazaAsignadaId: plazaModel._id.toString(),
    subplazaAsignadaNumero: subplaza.numero,
  };
}

async function releaseSubplaza(plazaAsignadaId?: unknown, subplazaAsignadaNumero?: number) {
  if (!plazaAsignadaId || subplazaAsignadaNumero === undefined) return;

  const idStr = String(plazaAsignadaId);
  const plaza: IPlaza | null = await Plaza.findById(idStr).lean<IPlaza | null>();
  if (!plaza) return;

  // load model to mutate
  const plazaModel = await Plaza.findById(idStr);
  if (!plazaModel) return;

  const subplaza = plazaModel.plazasFisicas.find((sp) => sp.numero === subplazaAsignadaNumero);
  if (!subplaza) return;

  subplaza.estado = 'disponible';
  subplaza.estadiaId = null;
  subplaza.usuarioAbonado = null;
  await plazaModel.save();
}

export async function GET(req: NextRequest) {
  await ensureDbConnection();
  const { searchParams } = new URL(req.url);
  const ticketNumber = searchParams.get('ticketNumber');
  const patente = searchParams.get('patente');
  const estado = searchParams.get('estado');

  const filter: FilterQuery<IEstadia> = {};
  if (ticketNumber) filter.ticket = ticketNumber;
  if (patente) filter.patente = patente.toUpperCase();
  if (estado) filter.estado = estado as IEstadia['estado'];

  try {
    const estadias = await Estadia.find(filter).sort({ horaEntrada: -1 }).lean<Record<string, unknown>[]>();
    return NextResponse.json(estadias, { status: 200 });
  } catch (err: unknown) {
    console.error('[api/estadias][GET]', err);
    return NextResponse.json({ error: (err instanceof Error && err.message) ? err.message : 'Error listando estadías' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  await ensureDbConnection();

  try {
    const raw: unknown = await req.json().catch(() => null);
    const data = (raw && typeof raw === 'object') ? (raw as Record<string, unknown>) : {};

    if (!data.operadorId || !data.parkinglotId || !data.tarifaId) {
      return NextResponse.json({ error: 'operadorId, parkinglotId y tarifaId son requeridos' }, { status: 400 });
    }

    const operadorId = toObjectId(data.operadorId, 'operadorId');
    const parkinglotId = toObjectId(data.parkinglotId, 'parkinglotId');
    const tarifaId = toObjectId(data.tarifaId, 'tarifaId');

    let plazaAsignadaId = data.plazaAsignadaId;
    let subplazaAsignadaNumero = (data.subplazaAsignadaNumero as number | undefined) ?? undefined;

    if (!plazaAsignadaId && data.tipoEstadia) {
      const assigned = await assignAvailableSubplaza(data as Partial<IEstadia>);
      plazaAsignadaId = assigned.plazaAsignadaId;
      subplazaAsignadaNumero = assigned.subplazaAsignadaNumero;
    }

    const nuevaEstadia = new Estadia({
      ...data,
      operadorId,
      parkinglotId,
      tarifaId,
      plazaAsignadaId: plazaAsignadaId && isValidObjectId(plazaAsignadaId) ? new mongoose.Types.ObjectId(String(plazaAsignadaId)) : undefined,
      subplazaAsignadaNumero,
    });

    const saved = await nuevaEstadia.save();

    if (plazaAsignadaId && subplazaAsignadaNumero !== undefined) {
      const plazaModel = await Plaza.findById(String(plazaAsignadaId));
      if (plazaModel) {
        const subplaza = plazaModel.plazasFisicas.find((sp) => sp.numero === subplazaAsignadaNumero);
        if (subplaza) {
          subplaza.estadiaId = saved._id.toString();
          if (saved.tipoEstadia === 'libre') {
            subplaza.usuarioAbonado = {
              ticketNumber: saved.ticket ?? '',
              patente: saved.patente ?? '',
            };
          }
          await plazaModel.save();
        }
      }
    }

    return NextResponse.json(saved, { status: 201 });
  } catch (err: unknown) {
    console.error('[api/estadias][POST]', err);
    return NextResponse.json({ error: (err instanceof Error && err.message) ? err.message : 'Error al crear estadía' }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  await ensureDbConnection();

  try {
    const data: Partial<IEstadia> & { _id?: string } = await req.json();
    if (!data._id) {
      return NextResponse.json({ error: '_id es requerido' }, { status: 400 });
    }

    const updateFields: Partial<IEstadia> = { ...data };
    delete updateFields._id;

    if (data.tipoEstadia && !data.plazaAsignadaId) {
      const assigned = await assignAvailableSubplaza(data);
      if (assigned.plazaAsignadaId) {
        updateFields.plazaAsignadaId = new mongoose.Types.ObjectId(assigned.plazaAsignadaId as string) as any;
        updateFields.subplazaAsignadaNumero = assigned.subplazaAsignadaNumero;
      }
    }

    const updated = await Estadia.findByIdAndUpdate(String(data._id), updateFields, {
      new: true,
      runValidators: true,
    }).lean<Record<string, unknown> | null>();

    if (!updated) {
      return NextResponse.json({ error: 'Estadía no encontrada' }, { status: 404 });
    }

    if ((updated.estado as unknown) === 'cerrada') {
      await releaseSubplaza(updated.plazaAsignadaId, updated.subplazaAsignadaNumero);
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (err: unknown) {
    console.error('[api/estadias][PUT]', err);
    return NextResponse.json({ error: (err instanceof Error && err.message) ? err.message : 'Error al actualizar estadía' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  await ensureDbConnection();

  try {
    const { searchParams } = new URL(req.url);
    const _id = searchParams.get('_id');
    if (!_id) {
      return NextResponse.json({ error: '_id es requerido' }, { status: 400 });
    }

    const deleted = await Estadia.findByIdAndDelete(_id);
    if (!deleted) {
      return NextResponse.json({ error: 'Estadía no encontrada' }, { status: 404 });
    }

    await releaseSubplaza(deleted.plazaAsignadaId, deleted.subplazaAsignadaNumero);

    return NextResponse.json({ message: 'Estadía eliminada correctamente' }, { status: 200 });
  } catch (err: any) {
    console.error('[api/estadias][DELETE]', err);
    return NextResponse.json({ error: err.message || 'Error al eliminar estadía' }, { status: 500 });
  }
}
