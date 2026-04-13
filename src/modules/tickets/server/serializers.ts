import type { ITicket } from '@/models/Ticket';
import type { IEstadia } from '@/models/Estadia';

function getId(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { toString?: () => string }).toString === 'function'
  ) {
    return (value as { toString: () => string }).toString();
  }
  return undefined;
}

import { calculateExpirationDate } from '@/lib/estadia/time';

export function serializeTicketEntity(ticket: ITicket) {
  const horaExpiracion = calculateExpirationDate({
    tipoEstadia: ticket.tipoEstadia,
    horaEntrada: ticket.horaEntrada,
    cantidadHoras: ticket.cantidadHoras,
    cantidadDias: ticket.cantidadDias,
    cantidadMeses: undefined,
  });

  return {
    _id: getId(ticket._id),
    ticketNumber: ticket.ticketNumber,
    patente: ticket.patente,
    categoria: ticket.categoria,
    cliente: ticket.cliente,
    tarifaId: getId(ticket.tarifaId),
    operadorId: getId(ticket.operadorId),
    horaEntrada: ticket.horaEntrada?.toISOString?.() ?? null,
    horaSalida: ticket.horaSalida?.toISOString?.() ?? null,
    horaExpiracion: horaExpiracion?.toISOString?.() ?? null,
    estado: ticket.estado,
    totalCobrado: ticket.totalCobrado ?? 0,
    metodoPago: ticket.metodoPago,
    tipoEstadia: ticket.tipoEstadia,
    cantidadHoras: ticket.cantidadHoras,
    cantidadDias: ticket.cantidadDias,
    cantidad: ticket.cantidad,
    tarifaBaseHora: ticket.tarifaBaseHora,
    tarifa: ticket.tarifa,
    notas: ticket.notas,
    prepago: ticket.prepago ?? false,
    detalleCobro: ticket.detalleCobro,
    tiempoTotal: ticket.tiempoTotal,
    turnoId: getId(ticket.turnoId),
    billingDocumentId: getId(ticket.billingDocumentId),
    billingDocumentCode: ticket.billingDocumentCode ?? '',
    createdAt: ticket.createdAt?.toISOString?.() ?? null,
    updatedAt: ticket.updatedAt?.toISOString?.() ?? null,
  };
}

export function serializeEstadiaAsTicket(estadia: IEstadia) {
  return {
    _id: getId(estadia._id),
    ticketNumber: estadia.ticket,
    patente: estadia.patente,
    categoria: estadia.categoria,
    cliente: estadia.cliente,
    tarifaId: getId(estadia.tarifaId),
    operadorId: getId(estadia.operadorId),
    horaEntrada: estadia.horaEntrada?.toISOString?.() ?? null,
    horaSalida: estadia.horaSalida?.toISOString?.() ?? null,
    horaExpiracion: estadia.horaExpiracion?.toISOString?.() ?? null,
    estado: estadia.estado === 'cerrada' ? 'cerrada' : 'activa',
    totalCobrado: estadia.totalCobrado ?? 0,
    metodoPago: estadia.metodoPago,
    tipoEstadia: estadia.tipoEstadia,
    cantidadHoras: estadia.cantidadHoras,
    cantidadDias: estadia.cantidadDias,
    cantidad:
      estadia.tipoEstadia === 'hora'
        ? estadia.cantidadHoras ?? 1
        : estadia.tipoEstadia === 'dia'
          ? estadia.cantidadDias ?? 1
          : estadia.tipoEstadia === 'mensual'
            ? estadia.cantidadMeses ?? 1
            : 0,
    tarifaBaseHora: undefined,
    tarifa: undefined,
    notas: undefined,
    prepago: estadia.prepago ?? false,
    detalleCobro: undefined,
    tiempoTotal: undefined,
    turnoId: undefined,
    createdAt: estadia.createdAt?.toISOString?.() ?? null,
    updatedAt: estadia.updatedAt?.toISOString?.() ?? null,
  };
}
