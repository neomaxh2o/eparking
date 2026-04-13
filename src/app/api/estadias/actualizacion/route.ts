import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Estadia from '@/models/Estadia';
import Turno, { ITicket } from '@/models/Turno';

const METODOS_PAGO_VALIDOS = ['efectivo', 'tarjeta', 'qr', 'otros'] as const;

export async function PATCH(req: Request) {
  await dbConnect();

  try {
    const {
      ticketNumber,
      patente,
      categoria,
      tipoEstadia,
      tarifaBaseHora,
      tarifa,
      totalCobrado,
      metodoPago,
      prepago,
    } = await req.json();

    if (!ticketNumber) return NextResponse.json({ error: 'Falta ticketNumber' }, { status: 400 });

    const estadia = await Estadia.findOne({ ticketNumber });
    if (!estadia) return NextResponse.json({ error: 'Estadía no encontrada' }, { status: 404 });

    if (estadia.tipoEstadia !== 'libre' && estadia.categoria !== 'Otros') {
      return NextResponse.json({ error: 'Solo se pueden modificar tickets genéricos' }, { status: 403 });
    }

    if (patente !== undefined) estadia.patente = patente;
    if (categoria !== undefined) estadia.categoria = categoria;
    if (tipoEstadia !== undefined) estadia.tipoEstadia = tipoEstadia;
    if (tarifaBaseHora !== undefined) estadia.tarifaBaseHora = tarifaBaseHora;

    if (tarifa !== undefined) {
      if (typeof tarifa === 'number') {
        estadia.tarifa = tarifa;
      } else if (typeof tarifa === 'object' && tarifa !== null) {
        estadia.tarifa = tarifa.monto ?? tarifa.tarifaHora ?? 0;
      } else {
        estadia.tarifa = 0;
      }
    }

    if (totalCobrado !== undefined) estadia.totalCobrado = totalCobrado;
    if (metodoPago && METODOS_PAGO_VALIDOS.includes(metodoPago)) estadia.metodoPago = metodoPago;
    if (prepago !== undefined) estadia.prepago = prepago;

    await estadia.save();

    // actualizar ticket en Turno
    const turno = await Turno.findOne({ operatorId: estadia.operatorId, estado: 'abierto' });
    if (turno) {
      const ticketIndex = turno.tickets.findIndex((t: ITicket) => t.ticketNumber === ticketNumber);
      if (ticketIndex >= 0) {
        const ticket = turno.tickets[ticketIndex];
        turno.totalTurno = turno.totalTurno - (ticket.totalCobrado ?? 0) + (estadia.totalCobrado ?? 0);

        ticket.patente = estadia.patente;
        ticket.categoria = estadia.categoria;
        ticket.tipoEstadia = estadia.tipoEstadia;
        ticket.tarifaBaseHora = estadia.tarifaBaseHora;
        ticket.tarifa = estadia.tarifa;
        ticket.totalCobrado = estadia.totalCobrado;
        ticket.metodoPago = estadia.metodoPago;
        ticket.prepago = estadia.prepago ?? false;

        await turno.save();
      }
    }

    return NextResponse.json(estadia, { status: 200 });
  } catch (error: any) {
    console.error('❌ Error PATCH ticket:', error);
    return NextResponse.json({ error: 'Error al modificar el ticket' }, { status: 500 });
  }
}
