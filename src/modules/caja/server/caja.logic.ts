import Turno, { ITicket } from '@/models/Turno';
import Estadia from '@/models/Estadia';
import { Tarifa } from '@/models/Tarifa';
import User from '@/models/User';
import Ticket from '@/models/Ticket';
import { getFechaActual } from '@/app/helpers/fechaHelpers';
import { calculateExpirationDate } from '@/lib/estadia/time';
import { calcularTotal } from '@/lib/calculos/estadia';
import { ensureTurnoIdentity } from '@/lib/caja/turnoIdentity';
import { getTurnoAbiertoByOperator } from '@/modules/turnos/server/turno.logic';
import { createTicket, closeTicket, getTicketByNumber, updateTicket } from '@/modules/tickets/server/ticket.logic';
import { describeCommercialUnit } from '@/modules/caja/server/commercial';

function generateTicketNumber() {
  const now = new Date();
  const seed = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');

  return `T-${seed}-${random}`;
}

const METODOS_PAGO_VALIDOS = ['efectivo', 'tarjeta', 'qr', 'otros'] as const;

type MetodoPago = (typeof METODOS_PAGO_VALIDOS)[number];

type CloseEstadiaInput = {
  ticketNumber: string;
  metodoPago?: string;
  prepago?: boolean;
  pagado?: boolean;
  categoria?: string;
  tipoEstadia?: string;
  patente?: string;
  tarifaId?: string;
  totalCobrado?: number;
  detalleCobro?: string;
  horaSalida?: string;
  cantidadHoras?: number;
  cantidadDias?: number;
};

export async function registrarIngreso(payload: {
  operatorId: string;
  patente: string;
  categoria: 'Automóvil' | 'Camioneta' | 'Bicicleta' | 'Motocicleta' | 'Otros';
  cliente?: {
    nombre?: string;
    apellido?: string;
    dni?: string;
    telefono?: string;
  };
  tarifaId?: string;
  tipoEstadia?: 'hora' | 'dia' | 'libre';
  cantidad?: number;
  prepago?: boolean;
  horaEntrada?: string;
  tarifaSeleccionada?: {
    tarifaId: string;
    tipoEstadia: 'hora' | 'dia' | 'libre';
    cantidad: number;
    precioUnitario: number;
    precioTotal: number;
  };
}) {
  const turno = await getTurnoAbiertoByOperator(payload.operatorId);
  if (!turno) {
    throw new Error('Debe existir un turno abierto para registrar ingresos.');
  }

  const operator = await User.findById(payload.operatorId).select('assignedParking role').lean();
  if (!operator) {
    throw new Error('Operador no encontrado.');
  }

  const assignedParking = (operator as { assignedParking?: unknown }).assignedParking;
  if (!assignedParking) {
    throw new Error('El operador no tiene un parking asignado.');
  }

  const parkinglotId = String(assignedParking);
  const categoria = payload.categoria ?? 'Automóvil';
  const tipoEstadia = payload.tarifaSeleccionada?.tipoEstadia ?? payload.tipoEstadia ?? 'libre';
  const cantidad = payload.tarifaSeleccionada
    ? payload.tarifaSeleccionada.cantidad
    : typeof payload.cantidad === 'number'
      ? payload.cantidad
      : tipoEstadia === 'libre'
        ? 0
        : 1;

  const tarifaIdCandidate = payload.tarifaSeleccionada?.tarifaId ?? payload.tarifaId;
  const tarifaDoc = tarifaIdCandidate
    ? await Tarifa.findById(tarifaIdCandidate).lean()
    : await Tarifa.findOne({ parkinglotId, category: categoria }).lean();

  if (!tarifaDoc) {
    throw new Error('No se encontró tarifa para el parking y categoría del operador.');
  }

  const tarifaId = String((tarifaDoc as { _id?: unknown })._id ?? payload.tarifaId ?? '');

  let tarifaSnapshot: {
    _id?: string;
    nombre?: string;
    tarifaHora?: number;
    tarifaDia?: number;
    tarifaLibre?: number;
    tarifaBaseHora?: number;
    fraccionMinutos?: number;
  } | undefined;

  if (tipoEstadia === 'hora') {
    const tarifasHora = [...(((tarifaDoc as { tarifasHora?: Array<{ cantidad?: number; precioUnitario?: number; precioTotal?: number; precioConDescuento?: number }> }).tarifasHora) ?? [])]
      .sort((a, b) => Number(a.cantidad ?? 0) - Number(b.cantidad ?? 0));
    const tarifaHora = payload.tarifaSeleccionada
      ? tarifasHora.find((item) => Number(item.cantidad ?? 0) === payload.tarifaSeleccionada?.cantidad)
      : tarifasHora.find((item) => Number(item.cantidad ?? 0) === cantidad);

    if (!tarifaHora) {
      throw new Error('No existe una subtarifa por hora para la cantidad seleccionada.');
    }

    tarifaSnapshot = {
      _id: tarifaId,
      nombre: `${categoria} hora`,
      tarifaHora: Number(tarifaHora.precioUnitario ?? tarifaHora.precioConDescuento ?? tarifaHora.precioTotal ?? 0),
      tarifaBaseHora: Number(tarifaHora.precioUnitario ?? 0),
      fraccionMinutos: 60,
      tipoEstadiaAplicada: 'hora',
      cantidadAplicada: Number(tarifaHora.cantidad ?? cantidad),
      precioUnitarioAplicado: Number(tarifaHora.precioUnitario ?? 0),
      precioTotalAplicado: Number(tarifaHora.precioTotal ?? tarifaHora.precioConDescuento ?? tarifaHora.precioUnitario ?? 0),
    };
  } else if (tipoEstadia === 'dia') {
    const tarifasDia = [...(((tarifaDoc as { tarifasPorDia?: Array<{ cantidad?: number; precioUnitario?: number; precioTotal?: number; precioConDescuento?: number }> }).tarifasPorDia) ?? [])]
      .sort((a, b) => Number(a.cantidad ?? 0) - Number(b.cantidad ?? 0));
    const tarifaDia = payload.tarifaSeleccionada
      ? tarifasDia.find((item) => Number(item.cantidad ?? 0) === payload.tarifaSeleccionada?.cantidad)
      : tarifasDia.find((item) => Number(item.cantidad ?? 0) === cantidad);

    if (!tarifaDia) {
      throw new Error('No existe una subtarifa por día para la cantidad seleccionada.');
    }

    tarifaSnapshot = {
      _id: tarifaId,
      nombre: `${categoria} día`,
      tarifaDia: Number(tarifaDia.precioUnitario ?? tarifaDia.precioConDescuento ?? tarifaDia.precioTotal ?? 0),
      tipoEstadiaAplicada: 'dia',
      cantidadAplicada: Number(tarifaDia.cantidad ?? cantidad),
      precioUnitarioAplicado: Number(tarifaDia.precioUnitario ?? 0),
      precioTotalAplicado: Number(tarifaDia.precioTotal ?? tarifaDia.precioConDescuento ?? tarifaDia.precioUnitario ?? 0),
    };
  } else {
    const tarifaLibre = ((tarifaDoc as { tarifaLibre?: Array<{ precioUnitario?: number; precioTotal?: number; precioConDescuento?: number }> }).tarifaLibre ?? [])[0];
    if (!tarifaLibre) {
      throw new Error('No existe una tarifa libre para la categoría seleccionada.');
    }
    tarifaSnapshot = {
      _id: tarifaId,
      nombre: `${categoria} libre`,
      tarifaLibre: Number(tarifaLibre.precioUnitario ?? tarifaLibre.precioConDescuento ?? tarifaLibre.precioTotal ?? 0),
      tipoEstadiaAplicada: 'libre',
      cantidadAplicada: 0,
      precioUnitarioAplicado: Number(tarifaLibre.precioUnitario ?? 0),
      precioTotalAplicado: Number(tarifaLibre.precioTotal ?? tarifaLibre.precioConDescuento ?? tarifaLibre.precioUnitario ?? 0),
    };
  }

  const cantidadAplicada = tarifaSnapshot?.cantidadAplicada ?? cantidad;
  const horaEntrada = payload.horaEntrada ? new Date(payload.horaEntrada) : new Date();

  const totalPrepago = payload.prepago
    ? Number(tarifaSnapshot?.precioTotalAplicado ?? tarifaSnapshot?.tarifaLibre ?? tarifaSnapshot?.tarifaDia ?? tarifaSnapshot?.tarifaHora ?? 0)
    : 0;
  const commercialUnit = describeCommercialUnit({
    tipoEstadia,
    cantidadHoras: tipoEstadia === 'hora' ? cantidadAplicada : undefined,
    cantidadDias: tipoEstadia === 'dia' ? cantidadAplicada : undefined,
    tarifa: tarifaSnapshot,
  });

  const ticket = await createTicket({
    ticketNumber: generateTicketNumber(),
    patente: String(payload.patente || '').trim().toUpperCase(),
    categoria,
    cliente: payload.cliente,
    tarifaId,
    operadorId: payload.operatorId,
    horaEntrada,
    tipoEstadia,
    cantidad: cantidadAplicada,
    cantidadHoras: tipoEstadia === 'hora' ? cantidadAplicada : undefined,
    cantidadDias: tipoEstadia === 'dia' ? cantidadAplicada : undefined,
    tarifaBaseHora: tarifaSnapshot?.tarifaBaseHora,
    tarifa: tarifaSnapshot,
    prepago: Boolean(payload.prepago),
    turnoId: turno._id,
    totalCobrado: totalPrepago,
    metodoPago: (payload as { metodoPago?: 'efectivo' | 'tarjeta' | 'qr' | 'otros' }).metodoPago,
    detalleCobro: payload.prepago ? `${commercialUnit} · Prepago registrado por $${totalPrepago}` : commercialUnit,
  });

  const horaExpiracion = calculateExpirationDate({
    tipoEstadia,
    horaEntrada,
    cantidadHoras: tipoEstadia === 'hora' ? cantidadAplicada : undefined,
    cantidadDias: tipoEstadia === 'dia' ? cantidadAplicada : undefined,
    cantidadMeses: undefined,
  });

  await Estadia.create({
    ticket: ticket.ticketNumber,
    patente: ticket.patente,
    categoria: ticket.categoria,
    cliente: ticket.cliente,
    tarifaId,
    operadorId: payload.operatorId,
    parkinglotId,
    horaEntrada,
    horaExpiracion,
    estado: payload.prepago ? 'prepago' : 'activa',
    tipoEstadia,
    cantidadHoras: tipoEstadia === 'hora' ? cantidadAplicada : 0,
    cantidadDias: tipoEstadia === 'dia' ? cantidadAplicada : 0,
    cantidadMeses: 0,
    prepago: Boolean(payload.prepago),
    metodoPago: (payload as { metodoPago?: string }).metodoPago,
    totalCobrado: totalPrepago,
    detalleCobro: payload.prepago ? `${commercialUnit} · Prepago registrado por $${totalPrepago}` : commercialUnit,
  });

  return ticket;
}

export async function obtenerTicketPorNumero(ticketNumber: string) {
  return getTicketByNumber(ticketNumber);
}

async function upsertTurnoTicket(operatorId: string, ticketObj: ITicket, totalCobrado: number) {
  let turno = await Turno.findOne({ operatorId, estado: 'abierto' });

  if (!turno) {
    const identity = await ensureTurnoIdentity(operatorId, 1, 0);
    turno = await Turno.create({
      operatorId,
      tickets: [ticketObj],
      totalTurno: totalCobrado,
      estado: 'abierto',
      numeroCaja: 1,
      ...identity,
    });
    return turno;
  }

  const ticketIndex = turno.tickets.findIndex((t: ITicket) => t.ticketNumber === ticketObj.ticketNumber);
  const toAmount = (t: ITicket | typeof ticketObj) => {
    // Use actual collected amount when present;
    // otherwise derive expected amount from tarifa snapshot fields (precioTotalAplicado, tarifaHora*qty, tarifaBaseHora*qty)
    const collected = Number(t.totalCobrado ?? 0);
    if (collected > 0) return collected;

    const tarifa = (t as any).tarifa || {};
    const qty = Number((t as any).cantidad ?? (t as any).cantidadHoras ?? 1);

    if (typeof tarifa.precioTotalAplicado === 'number' && tarifa.precioTotalAplicado > 0) return Number(tarifa.precioTotalAplicado);
    if (typeof tarifa.tarifaHora === 'number' && tarifa.tarifaHora > 0) return Number(tarifa.tarifaHora) * Math.max(1, qty);
    if (typeof tarifa.tarifaBaseHora === 'number' && tarifa.tarifaBaseHora > 0) return Number(tarifa.tarifaBaseHora) * Math.max(1, qty);

    return 0;
  };

  if (ticketIndex >= 0) {
    const ticketPrevio = turno.tickets[ticketIndex];
    turno.totalTurno = turno.totalTurno - toAmount(ticketPrevio) + toAmount(ticketObj);
    turno.tickets[ticketIndex] = ticketObj;
  } else {
    turno.tickets.push(ticketObj);
    turno.totalTurno += toAmount(ticketObj);
  }

  await turno.save();
  return turno;
}

export async function cerrarEstadiaYActualizarTurno(input: CloseEstadiaInput) {
  const {
    ticketNumber,
    metodoPago,
    prepago,
    pagado,
    categoria,
    tipoEstadia,
    patente,
    tarifaId,
    totalCobrado,
    detalleCobro,
    horaSalida: horaSalidaFront,
    cantidadHoras: cantidadHorasInput,
    cantidadDias: cantidadDiasInput,
  } = input;

  if (!ticketNumber) {
    throw new Error('Falta ticketNumber');
  }

  const metodo: MetodoPago = METODOS_PAGO_VALIDOS.includes(metodoPago as MetodoPago)
    ? (metodoPago as MetodoPago)
    : 'otros';

  if (prepago && pagado !== true) {
    throw new Error('No se puede cerrar un ticket prepago sin confirmar pago.');
  }

  const estadia = await Estadia.findOne({
    ticketNumber,
    estado: 'activa',
    ...(prepago ? { prepago: true } : {}),
  });

  if (!estadia) {
    throw new Error('Estadía no encontrada o no coincide con prepago');
  }

  const tarifa = await Tarifa.findById(estadia.tarifaId);
  if (!tarifa) {
    throw new Error('Tarifa no encontrada');
  }

  const horaSalida = horaSalidaFront ? new Date(horaSalidaFront) : new Date(getFechaActual());
  const diffMin = Math.ceil((horaSalida.getTime() - estadia.horaEntrada.getTime()) / (1000 * 60));

  const cantidadHoras = cantidadHorasInput ? Number(cantidadHorasInput) : undefined;
  const cantidadDias = cantidadDiasInput ? Number(cantidadDiasInput) : undefined;
  const cantidadManual =
    estadia.tipoEstadia === 'hora'
      ? cantidadHoras
      : estadia.tipoEstadia === 'dia'
        ? cantidadDias
        : undefined;

  const { total, detalle, cantidadHoras: calcHoras, cantidadDias: calcDias } = calcularTotal(
    estadia,
    tarifa,
    diffMin,
    cantidadManual,
  );

  if (estadia.tipoEstadia === 'hora') {
    estadia.cantidadHoras = cantidadManual ?? calcHoras ?? 1;
    estadia.cantidadDias = undefined;
  } else if (estadia.tipoEstadia === 'dia') {
    estadia.cantidadDias = cantidadManual ?? calcDias ?? 1;
    estadia.cantidadHoras = undefined;
  } else {
    estadia.cantidadHoras = undefined;
    estadia.cantidadDias = undefined;
  }

  estadia.horaSalida = horaSalida;
  estadia.estado = 'cerrada';
  estadia.totalCobrado = totalCobrado ?? total;
  estadia.metodoPago = metodo;
  estadia.categoria = (categoria as typeof estadia.categoria) ?? estadia.categoria;
  estadia.tipoEstadia = (tipoEstadia as typeof estadia.tipoEstadia) ?? estadia.tipoEstadia;
  estadia.patente = patente ?? estadia.patente;
  estadia.tarifaId = tarifaId ?? estadia.tarifaId;
  estadia.tarifa = (tarifa as { tarifaHora?: number }).tarifaHora ?? 0;
  estadia.detalleCobro = detalleCobro ?? detalle;
  estadia.prepago = prepago ?? estadia.prepago;

  await estadia.save();

  const ticketObj: ITicket = {
    ticketNumber: estadia.ticketNumber,
    patente: estadia.patente,
    categoria: estadia.categoria,
    operadorId: estadia.operatorId,
    cliente: estadia.cliente,
    horaEntrada: estadia.horaEntrada,
    horaSalida: estadia.horaSalida,
    totalCobrado: estadia.totalCobrado,
    tipoEstadia: estadia.tipoEstadia,
    cantidadHoras: estadia.cantidadHoras,
    cantidadDias: estadia.cantidadDias,
    tarifaId: estadia.tarifaId,
    tarifaBaseHora: (tarifa as { tarifaHora?: number }).tarifaHora ?? 0,
    tarifa: estadia.tarifa,
    metodoPago: estadia.metodoPago,
    estado: 'cerrada',
    prepago: estadia.prepago,
    detalleCobro: estadia.detalleCobro,
  };

  await upsertTurnoTicket(String(estadia.operatorId), ticketObj, Number(estadia.totalCobrado ?? 0));

  return {
    estadia,
    ticket: ticketObj,
    message: prepago ? 'Prepago cerrado correctamente' : 'Salida registrada correctamente',
  };
}

export async function registrarSalida(payload: {
  ticketNumber: string;
  patente?: string;
  categoria?: 'Automóvil' | 'Camioneta' | 'Bicicleta' | 'Motocicleta' | 'Otros';
  tipoEstadia?: 'hora' | 'dia' | 'libre';
  metodoPago?: 'efectivo' | 'tarjeta' | 'qr' | 'otros';
  tarifaId?: string;
  tarifa?: {
    _id?: string;
    nombre?: string;
    tarifaHora?: number;
    tarifaDia?: number;
    tarifaLibre?: number;
    tarifaBaseHora?: number;
    fraccionMinutos?: number;
  };
  totalCobrado?: number;
  detalleCobro?: string;
  tiempoTotal?: string;
  horaSalida?: string;
}) {
  const ticket = await closeTicket({
    ticketNumber: payload.ticketNumber,
    horaSalida: payload.horaSalida ? new Date(payload.horaSalida) : new Date(),
    totalCobrado: payload.totalCobrado,
    metodoPago: payload.metodoPago,
    detalleCobro: payload.detalleCobro,
    tiempoTotal: payload.tiempoTotal,
    tarifa: payload.tarifa,
  });

  if (ticket.turnoId) {
    const turno = await Turno.findById(ticket.turnoId);
    if (turno && turno.estado === 'abierto') {
      const ticketsCerrados = await Ticket.find({
        turnoId: turno._id,
        estado: 'cerrada',
      }).lean();

      turno.totalTurno = ticketsCerrados.reduce(
        (acc, current) => acc + Number(current.totalCobrado ?? 0),
        0,
      );

      await turno.save();
    }
  }

  return ticket;
}

export async function modificarTicket(
  ticketNumber: string,
  cambios: Partial<{
    patente: string;
    categoria: 'Automóvil' | 'Camioneta' | 'Bicicleta' | 'Motocicleta' | 'Otros';
    tipoEstadia: 'hora' | 'dia' | 'libre';
    metodoPago: 'efectivo' | 'tarjeta' | 'qr' | 'otros';
    totalCobrado: number;
    detalleCobro: string;
    tiempoTotal: string;
    horaSalida: string;
    estado: 'activa' | 'cerrada';
    tarifaId: string;
    tarifa: {
      _id?: string;
      nombre?: string;
      tarifaHora?: number;
      tarifaDia?: number;
      tarifaLibre?: number;
      tarifaBaseHora?: number;
      fraccionMinutos?: number;
    };
    prepago: boolean;
  }>,
) {
  return updateTicket(ticketNumber, {
    patente: cambios.patente,
    categoria: cambios.categoria,
    tipoEstadia: cambios.tipoEstadia,
    metodoPago: cambios.metodoPago,
    totalCobrado: cambios.totalCobrado,
    detalleCobro: cambios.detalleCobro,
    tiempoTotal: cambios.tiempoTotal,
    horaSalida: cambios.horaSalida ? new Date(cambios.horaSalida) : undefined,
    estado: cambios.estado,
    tarifaId: cambios.tarifaId,
    tarifa: cambios.tarifa,
    prepago: cambios.prepago,
    cantidad: cambios.cantidad,
    cantidadHoras: cambios.cantidadHoras,
    cantidadDias: cambios.cantidadDias,
  });
}
