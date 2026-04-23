import Turno from '@/models/Turno';
import Ticket from '@/models/Ticket';
import CajaMovimiento from '@/models/CajaMovimiento';
import TurnoLiquidacion from '@/models/TurnoLiquidacion';

function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}

type AdminTurnoLiquidacionPayload = {
  turnoId: string;
  parkinglotId: string | null;
  cajaId: string | null;
  cajaNumero: number | null;
  codigoTurno: string;
  operadorAperturaId: string | null;
  operadorCierreId: string;
  liquidadoPor: string;
  fechaApertura: Date | null;
  fechaCierre: Date;
  cantidadTickets: number;
  cantidadOperaciones: number;
  totalEfectivo: number;
  totalTransferencia: number;
  totalTarjeta: number;
  totalOtros: number;
  totalIngresos: number;
  totalEgresos: number;
  saldoTeorico: number;
  saldoDeclarado: number;
  diferenciaCaja: number;
  observaciones: string;
  snapshot: Record<string, unknown>;
};

function normalizePaymentMethod(value: unknown) {
  const method = String(value ?? '').trim().toLowerCase();
  if (method === 'efectivo') return 'efectivo';
  if (method === 'tarjeta') return 'tarjeta';
  if (method === 'transferencia' || method === 'transfer' || method === 'qr' || method === 'electronic') return 'transferencia';
  return 'otros';
}

export async function buildAdminTurnoLiquidacion(turnoId: string, liquidadoPor: string, observaciones?: string): Promise<{
  turno: Record<string, unknown>;
  snapshot: Record<string, unknown>;
  payload: AdminTurnoLiquidacionPayload;
}> {
  const turno = await Turno.findById(turnoId).lean<Record<string, unknown> | null>();
  if (!turno) {
    throw new Error('No existe el turno indicado para liquidar.');
  }

  if (!turno.esCajaAdministrativa) {
    throw new Error('La liquidación administrativa solo aplica a turnos de caja administrativa.');
  }

  if (String(turno.estado ?? '') === 'liquidado') {
    throw new Error('El turno ya fue liquidado.');
  }

  const [tickets, movimientos] = await Promise.all([
    Ticket.find({ turnoId }).lean<Record<string, unknown>[]>(),
    CajaMovimiento.find({ turnoId }).sort({ createdAt: 1 }).lean<Record<string, unknown>[]>(),
  ]);

  const totals = {
    efectivo: 0,
    transferencia: 0,
    tarjeta: 0,
    otros: 0,
    ingresos: 0,
    egresos: 0,
  };

  for (const ticket of tickets) {
    const amount = roundCurrency(Number(ticket.totalCobrado ?? 0));
    const bucket = normalizePaymentMethod(ticket.metodoPago);
    if (bucket === 'efectivo') totals.efectivo += amount;
    else if (bucket === 'tarjeta') totals.tarjeta += amount;
    else if (bucket === 'transferencia') totals.transferencia += amount;
    else totals.otros += amount;
    totals.ingresos += amount;
  }

  const movementSnapshots = movimientos.map((movimiento) => {
    const amount = roundCurrency(Number(movimiento.amount ?? 0));
    const bucket = normalizePaymentMethod(movimiento.paymentMethod);
    const isEgreso = amount < 0;
    const absAmount = Math.abs(amount);

    if (bucket === 'efectivo') totals.efectivo += amount;
    else if (bucket === 'tarjeta') totals.tarjeta += amount;
    else if (bucket === 'transferencia') totals.transferencia += amount;
    else totals.otros += amount;

    if (isEgreso) totals.egresos += absAmount;
    else totals.ingresos += absAmount;

    return {
      _id: String(movimiento._id ?? ''),
      sourceType: String(movimiento.sourceType ?? ''),
      sourceId: String(movimiento.sourceId ?? ''),
      amount,
      paymentMethod: String(movimiento.paymentMethod ?? ''),
      paymentReference: String(movimiento.paymentReference ?? ''),
      status: String(movimiento.status ?? ''),
      createdAt: movimiento.createdAt,
      snapshot: movimiento.snapshot ?? {},
    };
  });

  const totalEfectivo = roundCurrency(totals.efectivo);
  const totalTransferencia = roundCurrency(totals.transferencia);
  const totalTarjeta = roundCurrency(totals.tarjeta);
  const totalOtros = roundCurrency(totals.otros);
  const totalIngresos = roundCurrency(totals.ingresos);
  const totalEgresos = roundCurrency(totals.egresos);
  const saldoTeorico = roundCurrency(totalIngresos - totalEgresos);

  const snapshot = {
    turno: {
      turnoId: String(turno._id ?? turnoId),
      codigoTurno: String(turno.codigoTurno ?? ''),
      parkinglotId: turno.parkinglotId ? String(turno.parkinglotId) : turno.assignedParking ? String(turno.assignedParking) : null,
      cajaId: turno.cajaId ? String(turno.cajaId) : null,
      cajaNumero: Number(turno.cajaNumero ?? turno.numeroCaja ?? 0) || null,
      operadorAperturaId: turno.operatorId ? String(turno.operatorId) : null,
      fechaApertura: turno.fechaApertura ?? null,
      fechaCierre: new Date(),
      estadoOriginal: String(turno.estado ?? ''),
    },
    totals: {
      totalEfectivo,
      totalTransferencia,
      totalTarjeta,
      totalOtros,
      totalIngresos,
      totalEgresos,
      saldoTeorico,
      cantidadTickets: tickets.length,
      cantidadOperaciones: tickets.length + movimientos.length,
    },
    tickets: tickets.map((ticket) => ({
      _id: String(ticket._id ?? ''),
      ticketNumber: String(ticket.ticketNumber ?? ''),
      totalCobrado: roundCurrency(Number(ticket.totalCobrado ?? 0)),
      metodoPago: String(ticket.metodoPago ?? ''),
      estado: String(ticket.estado ?? ''),
      createdAt: ticket.createdAt ?? null,
      updatedAt: ticket.updatedAt ?? null,
    })),
    movimientos: movementSnapshots,
  };

  return {
    turno,
    snapshot,
    payload: {
      turnoId: String(turno._id ?? turnoId),
      parkinglotId: turno.parkinglotId ? String(turno.parkinglotId) : turno.assignedParking ? String(turno.assignedParking) : null,
      cajaId: turno.cajaId ? String(turno.cajaId) : null,
      cajaNumero: Number(turno.cajaNumero ?? turno.numeroCaja ?? 0) || null,
      codigoTurno: String(turno.codigoTurno ?? ''),
      operadorAperturaId: turno.operatorId ? String(turno.operatorId) : null,
      operadorCierreId: liquidadoPor,
      liquidadoPor,
      fechaApertura: turno.fechaApertura ? new Date(String(turno.fechaApertura)) : null,
      fechaCierre: new Date(),
      cantidadTickets: tickets.length,
      cantidadOperaciones: tickets.length + movimientos.length,
      totalEfectivo,
      totalTransferencia,
      totalTarjeta,
      totalOtros,
      totalIngresos,
      totalEgresos,
      saldoTeorico,
      saldoDeclarado: saldoTeorico,
      diferenciaCaja: 0,
      observaciones: (observaciones ?? '').trim(),
      snapshot,
    },
  };
}

export async function getTurnoLiquidacionSnapshot(turnoId: string) {
  return TurnoLiquidacion.findOne({ turnoId }).lean();
}
