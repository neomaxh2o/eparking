import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Turno from '@/models/Turno';
import Ticket from '@/models/Ticket';
import Estadia from '@/models/Estadia';
import { calculateExpirationDate } from '@/lib/estadia/time';
import { describeCommercialUnit } from '@/modules/caja/server/commercial';

function formatEvento(ticket: Record<string, unknown>, estadia?: Record<string, unknown>) {
  const prepago = Boolean(estadia?.prepago ?? ticket.prepago);
  const estado = String(estadia?.estado ?? ticket.estado ?? 'activa');

  if (prepago && estado === 'cerrada') return 'CIERRE PREPAGO';
  if (prepago) return 'ALTA PREPAGO';
  if (estado === 'cerrada') return 'COBRO / CIERRE';
  return 'ALTA TICKET';
}

function formatEstado(ticket: Record<string, unknown>, estadia?: Record<string, unknown>, horaExpiracion?: Date) {
  const prepago = Boolean(estadia?.prepago ?? ticket.prepago);
  const estado = String(estadia?.estado ?? ticket.estado ?? 'activa');
  const totalCobrado = Number(estadia?.totalCobrado ?? ticket.totalCobrado ?? 0);

  if (prepago && estado !== 'cerrada') return 'PREPAGO PENDIENTE';
  if (prepago && estado === 'cerrada') return 'PREPAGO CERRADO';
  if (estado === 'cerrada' && totalCobrado > 0) return 'COBRADO';
  if (horaExpiracion && horaExpiracion.getTime() < Date.now() && estado !== 'cerrada') return 'VENCIDO';
  if (estado === 'activa') return 'ACTIVO';
  return estado.toUpperCase();
}

export async function GET(req: Request) {
  await dbConnect();

  try {
    const url = new URL(req.url);
    const operatorId = url.searchParams.get('operatorId');
    if (!operatorId) {
      return NextResponse.json({ error: 'Falta operatorId' }, { status: 400 });
    }

    const turno = await Turno.findOne({ operatorId, estado: 'abierto' }).lean();
    if (!turno) {
      return NextResponse.json({ items: [] });
    }

    const ticketsDocs = await Ticket.find({ turnoId: turno._id }).sort({ createdAt: -1 }).lean();
    const ticketNumbers = ticketsDocs.map((ticket) => String(ticket.ticketNumber));
    const estadiasDocs = await Estadia.find({ ticket: { $in: ticketNumbers } }).lean();
    const estadiasByTicket = new Map(estadiasDocs.map((estadia) => [String(estadia.ticket), estadia as Record<string, unknown>]));

    const items = ticketsDocs.map((ticket) => {
      const estadia = estadiasByTicket.get(String(ticket.ticketNumber));
      const horaEntrada = (estadia?.horaEntrada as Date | undefined) ?? ticket.horaEntrada;
      const horaExpiracion =
        (estadia?.horaExpiracion as Date | undefined) ??
        calculateExpirationDate({
          tipoEstadia: String(estadia?.tipoEstadia ?? ticket.tipoEstadia ?? 'libre') as 'hora' | 'dia' | 'libre' | 'mensual',
          horaEntrada,
          cantidadHoras: Number(estadia?.cantidadHoras ?? ticket.cantidadHoras ?? 0) || undefined,
          cantidadDias: Number(estadia?.cantidadDias ?? ticket.cantidadDays ?? ticket.cantidadDias ?? 0) || undefined,
          cantidadMeses: Number(estadia?.cantidadMeses ?? 0) || undefined,
        });

      const prepago = Boolean(estadia?.prepago ?? ticket.prepago ?? false);
      const totalCobrado = Number(estadia?.totalCobrado ?? ticket.totalCobrado ?? 0);
      const totalEsperado = Number(
        (ticket.tarifa as { precioTotalAplicado?: number; tarifaLibre?: number; tarifaDia?: number; tarifaHora?: number } | undefined)?.precioTotalAplicado ??
        (ticket.tarifa as { tarifaLibre?: number; tarifaDia?: number; tarifaHora?: number } | undefined)?.tarifaLibre ??
        (ticket.tarifa as { tarifaDia?: number; tarifaHora?: number } | undefined)?.tarifaDia ??
        (ticket.tarifa as { tarifaHora?: number } | undefined)?.tarifaHora ??
        0,
      );

      return {
        hora: (estadia?.createdAt as Date | undefined) ?? ticket.createdAt,
        evento: formatEvento(ticket as unknown as Record<string, unknown>, estadia),
        ticket: ticket.ticketNumber,
        patente: String(estadia?.patente ?? ticket.patente ?? 'SIN PATENTE'),
        tipo: describeCommercialUnit({
          tipoEstadia: String(estadia?.tipoEstadia ?? ticket.tipoEstadia ?? 'hora') as 'hora' | 'dia' | 'libre',
          cantidadHoras: Number(estadia?.cantidadHoras ?? ticket.cantidadHoras ?? 0) || undefined,
          cantidadDias: Number(estadia?.cantidadDias ?? ticket.cantidadDias ?? 0) || undefined,
          tarifa: ticket.tarifa as { tipoEstadiaAplicada?: 'hora' | 'dia' | 'libre'; cantidadAplicada?: number } | undefined,
        }),
        estado: formatEstado(ticket as unknown as Record<string, unknown>, estadia, horaExpiracion),
        prepago,
        vence: horaExpiracion ?? null,
        total: totalCobrado > 0 ? totalCobrado : totalEsperado,
      };
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error GET /api/caja/turno/eventos:', error);
    return NextResponse.json({ error: 'Error al obtener eventos del turno' }, { status: 500 });
  }
}
