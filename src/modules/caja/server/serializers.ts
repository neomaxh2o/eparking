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
        tipoEstadiaAplicada: ticket.tarifa.tipoEstadiaAplicada,
        cantidadAplicada: ticket.tarifa.cantidadAplicada,
        precioUnitarioAplicado: ticket.tarifa.precioUnitarioAplicado,
        precioTotalAplicado: ticket.tarifa.precioTotalAplicado,
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
  const UserModel = (await import('@/models/User')).default;

  const tickets = await TicketModel.find({ turnoId: turno._id })
    .sort({ horaEntrada: -1 })
    .lean();

  const operatorId = getId(turno.operatorId) ?? '';
  let operatorName = typeof turno.operatorName === 'string' ? turno.operatorName : '';

  if (!operatorName && operatorId) {
    const operator = await UserModel.findById(operatorId).select('name nombre apellido').lean();
    if (operator) {
      const plain = operator as PlainObject;
      operatorName =
        (typeof plain.name === 'string' && plain.name.trim()) ||
        [plain.nombre, plain.apellido].filter((v) => typeof v === 'string' && String(v).trim() !== '').join(' ') ||
        '';
    }
  }

  const serializedTickets = tickets.map(serializeTicket);
  const totalTurnoReal = serializedTickets.reduce((acc, ticket) => {
    const totalCobrado = Number(ticket.totalCobrado ?? 0);
    const totalEsperado = Number(
      ticket.tarifa?.precioTotalAplicado ??
      ticket.tarifa?.tarifaLibre ??
      ticket.tarifa?.tarifaDia ??
      ticket.tarifa?.tarifaHora ??
      0,
    );
    const totalTicket = totalCobrado > 0 ? totalCobrado : ticket.prepago ? totalEsperado : totalCobrado;
    return acc + totalTicket;
  }, 0);

  return {
    _id: getId(turno._id) ?? '',
    operatorId,
    operatorName,
    fechaApertura:
      turno.fechaApertura instanceof Date
        ? turno.fechaApertura.toISOString()
        : new Date(String(turno.fechaApertura)).toISOString(),
    fechaCierreOperativo: turno.fechaCierreOperativo
      ? turno.fechaCierreOperativo instanceof Date
        ? turno.fechaCierreOperativo.toISOString()
        : new Date(String(turno.fechaCierreOperativo)).toISOString()
      : undefined,
    fechaCierre: turno.fechaCierre
      ? turno.fechaCierre instanceof Date
        ? turno.fechaCierre.toISOString()
        : new Date(String(turno.fechaCierre)).toISOString()
      : undefined,
    tickets: serializedTickets,
    totalTurno: totalTurnoReal,
    estado: turno.estado,
    liquidacion: turno.liquidacion
      ? {
          efectivo: Number(turno.liquidacion.efectivo ?? 0),
          tarjeta: Number(turno.liquidacion.tarjeta ?? 0),
          otros: Number(turno.liquidacion.otros ?? 0),
          totalDeclarado: Number(turno.liquidacion.totalDeclarado ?? 0),
          totalSistema: Number(turno.liquidacion.totalSistema ?? totalTurnoReal ?? 0),
          diferencia: Number(turno.liquidacion.diferencia ?? 0),
          tipoDiferencia: turno.liquidacion.tipoDiferencia ?? 'sin_diferencia',
          observacion: turno.liquidacion.observacion,
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
