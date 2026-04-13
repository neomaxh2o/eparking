import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Ticket from '@/models/Ticket';
import {
  modificarTicket,
  obtenerTicketPorNumero,
  registrarSalida,
} from '@/modules/caja/server/caja.logic';
import { emitTicketBillingDocument } from '@/modules/billing';
import { updateTicket } from '@/modules/tickets/server/ticket.logic';
import { serializeTicketEntity } from '@/modules/tickets/server/serializers';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const ticketNumber = String(req.nextUrl.searchParams.get('ticketNumber') ?? '').trim();
    if (!ticketNumber) {
      return NextResponse.json({ error: 'ticketNumber es requerido' }, { status: 400 });
    }

    const ticket = await obtenerTicketPorNumero(ticketNumber);
    if (!ticket) {
      return NextResponse.json(null, { status: 200 });
    }

    return NextResponse.json(serializeTicketEntity(ticket), { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error obteniendo ticket' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const ticketNumber = String(body?.ticketNumber ?? '').trim();

    if (!ticketNumber) {
      return NextResponse.json({ error: 'ticketNumber es requerido' }, { status: 400 });
    }

    const ticket = await registrarSalida({
      ticketNumber,
      patente: body?.patente,
      categoria: body?.categoria,
      tipoEstadia: body?.tipoEstadia,
      metodoPago: body?.metodoPago,
      tarifaId: body?.tarifaId,
      tarifa: body?.tarifa,
      totalCobrado: typeof body?.totalCobrado === 'number' ? body.totalCobrado : 0,
      detalleCobro: body?.detalleCobro,
      tiempoTotal: body?.tiempoTotal,
      horaSalida: body?.horaSalida,
    });

    let persistedTicket = ticket;

    if (!ticket.billingDocumentId && Number(ticket.totalCobrado ?? 0) > 0) {
      try {
        const freshTicket = await Ticket.findById(ticket._id).lean();
        if (freshTicket) {
          const billingDocument = await emitTicketBillingDocument({
            actorRole: 'operator',
            actorUserId: String((freshTicket as any).operadorId ?? ''),
            ticketId: String((freshTicket as any)._id),
            ticketNumber: String(freshTicket.ticketNumber),
            turnoId: (freshTicket as any).turnoId ? String((freshTicket as any).turnoId) : null,
            amount: Number(freshTicket.totalCobrado ?? 0),
            paymentMethod: freshTicket.metodoPago ?? null,
            patente: freshTicket.patente,
            categoria: freshTicket.categoria,
            tipoEstadia: freshTicket.tipoEstadia,
          });

          persistedTicket = await updateTicket(ticket.ticketNumber, {
            billingDocumentId: billingDocument._id,
            billingDocumentCode: String((billingDocument as any).invoiceCode ?? ''),
          });
        }
      } catch (billingError) {
        console.error('[api/v2/caja/salida] billing integration error:', billingError);
      }
    }

    return NextResponse.json({ ticket: serializeTicketEntity(persistedTicket) }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error registrando salida' },
      { status: 400 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const ticketNumber = String(body?.ticketNumber ?? '').trim();

    if (!ticketNumber) {
      return NextResponse.json({ error: 'ticketNumber es requerido' }, { status: 400 });
    }

    const ticket = await modificarTicket(ticketNumber, {
      patente: body?.patente,
      categoria: body?.categoria,
      tipoEstadia: body?.tipoEstadia,
      metodoPago: body?.metodoPago,
      totalCobrado: body?.totalCobrado,
      detalleCobro: body?.detalleCobro,
      tiempoTotal: body?.tiempoTotal,
      horaSalida: body?.horaSalida,
      estado: body?.estado,
      tarifaId: body?.tarifaId,
      tarifa: body?.tarifa,
      prepago: body?.prepago,
    });

    return NextResponse.json({ ticket: serializeTicketEntity(ticket) }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error modificando ticket' },
      { status: 400 },
    );
  }
}
