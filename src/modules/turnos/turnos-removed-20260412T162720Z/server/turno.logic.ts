import Turno from '@/models/Turno';
import Ticket from '@/models/Ticket';
import { ensureTurnoIdentity } from '@/lib/caja/turnoIdentity';

export async function getTurnoAbiertoByOperator(operatorId: string) {
  return Turno.findOne({ operatorId, estado: 'abierto' }).sort({ fechaApertura: -1 });
}

export async function getTurnosPendientesByOperator(operatorId: string) {
  const turnos = await Turno.find({ operatorId, estado: 'pendiente_liquidacion' }).sort({ fechaApertura: -1 });

  const turnosEnriquecidos = await Promise.all(
    turnos.map(async (turno) => {
      const tickets = await Ticket.find({ turnoId: turno._id }).lean();
      const totalReal = tickets.reduce((acc, ticket) => acc + Number(ticket.totalCobrado ?? 0), 0);
      turno.totalTurno = totalReal;
      return turno;
    }),
  );

  return turnosEnriquecidos;
}

export async function getTurnoPendienteById(turnoId: string, operatorId: string) {
  return Turno.findOne({
    _id: turnoId,
    operatorId,
    estado: 'pendiente_liquidacion',
  });
}

export async function abrirTurno(operatorId: string, numeroCaja = 1) {
  const existente = await getTurnoAbiertoByOperator(operatorId);
  if (existente) {
    throw new Error('Ya existe un turno abierto para este operador.');
  }

  const identity = await ensureTurnoIdentity(operatorId, numeroCaja, 0);

  const turno = await Turno.create({
    operatorId,
    numeroCaja,
    fechaApertura: new Date(),
    estado: 'abierto',
    totalTurno: 0,
    ...identity,
  });

  return turno;
}

export async function cerrarSubturno(operatorId: string) {
  const turno = await getTurnoAbiertoByOperator(operatorId);
  if (!turno) {
    throw new Error('No existe un turno abierto para cerrar.');
  }

  turno.estado = 'pendiente_liquidacion';
  turno.fechaCierreOperativo = new Date();
  await turno.save();

  return turno;
}

/**
 * Compatibilidad con la lógica anterior:
 * liquida el turno abierto actual.
 */
export async function liquidarTurno(
  operatorId: string,
  payload: { efectivo: number; tarjeta: number; otros: number; observacion?: string }
) {
  const turno = await getTurnoAbiertoByOperator(operatorId);
  if (!turno) {
    throw new Error('No existe un turno abierto para liquidar.');
  }

  const efectivo = Number(payload.efectivo ?? 0);
  const tarjeta = Number(payload.tarjeta ?? 0);
  const otros = Number(payload.otros ?? 0);
  const totalDeclarado = efectivo + tarjeta + otros;
  const tickets = await Ticket.find({ turnoId: turno._id }).lean();
  const totalSistema = tickets.reduce((acc, ticket) => acc + Number(ticket.totalCobrado ?? 0), 0);
  const diferencia = Number((totalDeclarado - totalSistema).toFixed(2));
  const tipoDiferencia = diferencia === 0 ? 'sin_diferencia' : diferencia > 0 ? 'sobrante' : 'faltante';

  turno.liquidacion = {
    efectivo,
    tarjeta,
    otros,
    totalDeclarado,
    totalSistema,
    diferencia,
    tipoDiferencia,
    observacion: payload.observacion?.trim() || undefined,
    fechaLiquidacion: new Date(),
  };

  await turno.save();
  return turno;
}

/**
 * Compatibilidad con la lógica anterior:
 * cierra el turno abierto actual si está conciliado.
 */
export async function cerrarTurno(operatorId: string) {
  const turno = await getTurnoAbiertoByOperator(operatorId);
  if (!turno) {
    throw new Error('No existe un turno abierto para cerrar.');
  }

  if (!turno.liquidacion) {
    throw new Error('Debe liquidar el turno antes de cerrarlo.');
  }

  const tickets = await Ticket.find({ turnoId: turno._id }).lean();
  const totalTurno = tickets.reduce((acc, ticket) => acc + Number(ticket.totalCobrado ?? 0), 0);
  turno.totalTurno = totalTurno;

  turno.estado = 'cerrado';
  turno.fechaCierre = new Date();

  await turno.save();
  return turno;
}

export async function liquidarTurnoPendiente(
  operatorId: string,
  turnoId: string,
  payload: { efectivo: number; tarjeta: number; otros: number; observacion?: string }
) {
  const turno = await getTurnoPendienteById(turnoId, operatorId);
  if (!turno) {
    throw new Error('No existe un subturno pendiente de liquidación.');
  }

  const efectivo = Number(payload.efectivo ?? 0);
  const tarjeta = Number(payload.tarjeta ?? 0);
  const otros = Number(payload.otros ?? 0);
  const totalDeclarado = efectivo + tarjeta + otros;
  const tickets = await Ticket.find({ turnoId: turno._id }).lean();
  const totalSistema = tickets.reduce((acc, ticket) => acc + Number(ticket.totalCobrado ?? 0), 0);
  const diferencia = Number((totalDeclarado - totalSistema).toFixed(2));
  const tipoDiferencia = diferencia === 0 ? 'sin_diferencia' : diferencia > 0 ? 'sobrante' : 'faltante';

  turno.liquidacion = {
    efectivo,
    tarjeta,
    otros,
    totalDeclarado,
    totalSistema,
    diferencia,
    tipoDiferencia,
    observacion: payload.observacion?.trim() || undefined,
    fechaLiquidacion: new Date(),
  };

  await turno.save();
  return turno;
}

export async function cerrarTurnoPendiente(operatorId: string, turnoId: string) {
  const turno = await getTurnoPendienteById(turnoId, operatorId);
  if (!turno) {
    throw new Error('No existe un subturno pendiente de liquidación.');
  }

  if (!turno.liquidacion) {
    throw new Error('Debe liquidar el subturno antes de cerrarlo.');
  }

  const tickets = await Ticket.find({ turnoId: turno._id }).lean();
  const totalTurno = tickets.reduce((acc, ticket) => acc + Number(ticket.totalCobrado ?? 0), 0);
  turno.totalTurno = totalTurno;

  turno.estado = 'cerrado';
  turno.fechaCierre = new Date();

  await turno.save();
  return turno;
}
