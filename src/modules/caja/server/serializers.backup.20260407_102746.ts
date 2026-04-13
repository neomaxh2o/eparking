import type { ITicket } from '@/models/Ticket';
import type { ITurno } from '@/models/Turno';

type PlainObject = Record<string, unknown>;

function getId(value: unknown): string | undefined {
  if (!value) return undefined;

  if (typeof value === 'string') return value;

  if (typeof value === 'object' && value !== null) {
    const maybe = value as { toString?: () => string; _id?: unknown };
    if (typeof maybe._id === 'string') return maybe._id;
    if (maybe._id && typeof (maybe._id as { toString?: () => string }).toString === 'function') {
      return (maybe._id as { toString: () => string }).toString();
    }
    if (typeof maybe.toString === 'function') return maybe.toString();
  }

  return undefined;
}

export function serializeTicket(ticket: ITicket | (PlainObject & { _id?: unknown })) {
  const tarifa = ticket.tarifa
    ? {
        _id: getId(ticket.tarifa._id),
        nombre: ticket.tarifa.nombre,
        tarifaHora: ticket.tarifa.tarifaHora ?? 0,
        tarifaDia: ticket.tarifa.tarifaDia ?? 0,
        tarifaLibre: ticket.tarifa.tarifaLibre ?? 0,
        tarifaBaseHora: ticket.tarifa.tarifaBaseHora ?? 0,
        fraccionMinutos: ticket.tarifa.fraccionMinutos ?? 60,
      }
    : undefined;

  return {
    _id: getId(ticket._id),
    ticketNumber: ticket.ticketNumber,
    patente: ticket.patente,
    categoria: ticket.categoria,
    cliente: ticket.cliente,
    tarifaId: getId(ticket.tarifaId),
    operadorId: getId(ticket.operadorId),
    horaEntrada:
      ticket.horaEntrada instanceof Date
        ? ticket.horaEntrada.toISOString()
        : new Date(String(ticket.horaEntrada)).toISOString(),
    horaSalida: ticket.horaSalida
      ? ticket.horaSalida instanceof Date
        ? ticket.horaSalida.toISOString()
        : new Date(String(ticket.horaSalida)).toISOString()
      : undefined,
    estado: ticket.estado,
    totalCobrado: ticket.totalCobrado ?? 0,
    metodoPago: ticket.metodoPago,
    tipoEstadia: ticket.tipoEstadia,
    cantidadHoras: ticket.cantidadHoras,
    cantidadDias: ticket.cantidadDias,
    cantidad: ticket.cantidad,
    tarifaBaseHora: ticket.tarifaBaseHora,
    tarifa,
    notas: ticket.notas,
    prepago: ticket.prepago ?? false,
    detalleCobro: ticket.detalleCobro,
    tiempoTotal: ticket.tiempoTotal,
    turnoId: getId(ticket.turnoId),
    createdAt:
      ticket.createdAt instanceof Date ? ticket.createdAt.toISOString() : undefined,
    updatedAt:
      ticket.updatedAt instanceof Date ? ticket.updatedAt.toISOString() : undefined,
  };
}

export async function serializeTurno(turno: ITurno | (PlainObject & { _id?: unknown })) {
  const TicketModel = (await import('@/models/Ticket')).default;

  const tickets = await TicketModel.find({ turnoId: turno._id })
    .sort({ horaEntrada: -1 })
    .lean();

  return {
    _id: getId(turno._id) ?? '',
    operatorId: getId(turno.operatorId) ?? '',
    fechaApertura:
      turno.fechaApertura instanceof Date
        ? turno.fechaApertura.toISOString()
        : new Date(String(turno.fechaApertura)).toISOString(),
    fechaCierre: turno.fechaCierre
      ? turno.fechaCierre instanceof Date
        ? turno.fechaCierre.toISOString()
        : new Date(String(turno.fechaCierre)).toISOString()
      : undefined,
    tickets: tickets.map(serializeTicket),
    totalTurno: Number(turno.totalTurno ?? 0),
    estado: turno.estado,
    liquidacion: turno.liquidacion
      ? {
          efectivo: Number(turno.liquidacion.efectivo ?? 0),
          tarjeta: Number(turno.liquidacion.tarjeta ?? 0),
          otros: Number(turno.liquidacion.otros ?? 0),
          totalDeclarado: Number(turno.liquidacion.totalDeclarado ?? 0),
          fechaLiquidacion:
            turno.liquidacion.fechaLiquidacion instanceof Date
              ? turno.liquidacion.fechaLiquidacion.toISOString()
              : new Date(String(turno.liquidacion.fechaLiquidacion)).toISOString(),
        }
      : undefined,
    observaciones: turno.observaciones,
    numeroCaja: Number(turno.numeroCaja ?? 1),
  };
}
