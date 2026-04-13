import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { cerrarEstadiaYActualizarTurno } from '@/modules/caja/server/caja.logic';

export async function PUT(req: Request) {
  await dbConnect();

  try {
    const body = await req.json();
    const ticketNumber = String(body?.ticketNumber ?? '').trim();
    const updateData = body?.updateData ?? {};

    const result = await cerrarEstadiaYActualizarTurno({
      ticketNumber,
      prepago: true,
      pagado: updateData.pagado,
      metodoPago: updateData.metodoPago,
      categoria: updateData.categoria,
      tipoEstadia: updateData.tipoEstadia,
      patente: updateData.patente,
      tarifaId: updateData.tarifaId,
      totalCobrado: updateData.totalCobrado,
      detalleCobro: updateData.detalleCobro,
      horaSalida: updateData.horaSalida,
      cantidadHoras: updateData.cantidadHoras,
      cantidadDias: updateData.cantidadDias,
    });

    return NextResponse.json({ message: result.message, ticket: result.ticket });
  } catch (err: unknown) {
    console.error('❌ Error cerrando prepago:', err);
    const message = err instanceof Error ? err.message : 'Error al cerrar prepago';
    const status =
      message.includes('Falta ticketNumber')
        ? 400
        : message.includes('Tarifa no encontrada') || message.includes('Estadía no encontrada')
          ? 404
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
