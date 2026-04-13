import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Estadia from '@/models/Estadia';
import { Tarifa } from '@/models/Tarifa';
import { getFechaActual } from '@/app/helpers/fechaHelpers';
import { calcularTotal } from '@/lib/calculos/estadia';
import { cerrarEstadiaYActualizarTurno } from '@/modules/caja/server/caja.logic';

export async function POST(req: Request) {
  await dbConnect();
  try {
    const body = await req.json();
    const result = await cerrarEstadiaYActualizarTurno(body);
    return NextResponse.json({ message: result.message, ticket: result.ticket });
  } catch (error) {
    console.error('❌ Error POST salida:', error);
    const message = error instanceof Error ? error.message : 'Error registrando salida';
    const status =
      message.includes('Falta ticketNumber')
        ? 400
        : message.includes('Tarifa no encontrada') || message.includes('Estadía no encontrada')
          ? 404
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(req: Request) {
  await dbConnect();
  try {
    const body = await req.json();
    const {
      ticketNumber,
      estado,
      horaSalida,
      totalCobrado,
      metodoPago,
      categoria,
      tipoEstadia,
      patente,
      tarifaId,
      tarifa,
      detalleCobro,
      prepago,
      cantidadHoras: cantidadHorasInput,
      cantidadDias: cantidadDiasInput,
    } = body;

    if (!ticketNumber) return NextResponse.json({ error: 'Falta ticketNumber' }, { status: 400 });

    const estadia = await Estadia.findOne({ ticketNumber });
    if (!estadia) return NextResponse.json({ error: 'Estadía no encontrada' }, { status: 404 });

    const cantidadHoras = cantidadHorasInput ? Number(cantidadHorasInput) : undefined;
    const cantidadDias = cantidadDiasInput ? Number(cantidadDiasInput) : undefined;

    estadia.estado = estado ?? estadia.estado;
    estadia.horaSalida = horaSalida ? new Date(horaSalida) : estadia.horaSalida;
    estadia.totalCobrado = totalCobrado ?? estadia.totalCobrado;
    estadia.metodoPago = metodoPago ?? estadia.metodoPago;
    estadia.categoria = categoria ?? estadia.categoria;
    estadia.tipoEstadia = tipoEstadia ?? estadia.tipoEstadia;
    estadia.patente = patente ?? estadia.patente;
    estadia.tarifaId = tarifaId ?? estadia.tarifaId;
    estadia.tarifa = tarifa ?? estadia.tarifa;
    estadia.detalleCobro = detalleCobro ?? estadia.detalleCobro;
    estadia.prepago = prepago ?? estadia.prepago;

    if (estadia.tipoEstadia === 'hora') {
      estadia.cantidadHoras = cantidadHoras ?? 1;
      estadia.cantidadDias = undefined;
    } else if (estadia.tipoEstadia === 'dia') {
      estadia.cantidadDias = cantidadDias ?? 1;
      estadia.cantidadHoras = undefined;
    } else {
      estadia.cantidadHoras = undefined;
      estadia.cantidadDias = undefined;
    }

    await estadia.save();
    return NextResponse.json(estadia, { status: 200 });
  } catch (error) {
    console.error('❌ Error PATCH ticket:', error);
    return NextResponse.json({ error: 'Error al modificar el ticket' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  await dbConnect();
  try {
    const url = new URL(req.url);
    const ticketNumber = url.searchParams.get('ticketNumber');
    if (!ticketNumber) return NextResponse.json({ error: 'Falta ticketNumber' }, { status: 400 });

    const estadia = await Estadia.findOne({ ticketNumber, estado: 'activa' });
    if (!estadia) return NextResponse.json({ error: 'Estadía no encontrada' }, { status: 404 });

    const tarifa = await Tarifa.findById(estadia.tarifaId);
    if (!tarifa) return NextResponse.json({ error: 'Tarifa no encontrada' }, { status: 404 });

    const now = new Date(getFechaActual());
    const diffMin = Math.ceil((now.getTime() - estadia.horaEntrada.getTime()) / (1000 * 60));

    const { total, detalle, cantidadHoras, cantidadDias } = calcularTotal(estadia, tarifa, diffMin);

    return NextResponse.json({
      ...estadia.toObject(),
      totalCobrado: total,
      detalleCobro: detalle,
      cantidadHoras: estadia.tipoEstadia === 'hora' ? cantidadHoras : undefined,
      cantidadDias: estadia.tipoEstadia === 'dia' ? cantidadDias : undefined,
      prepago: estadia.prepago ?? false,
    });
  } catch (error) {
    console.error('❌ Error GET ticket:', error);
    return NextResponse.json({ error: 'Error obteniendo ticket' }, { status: 500 });
  }
}
