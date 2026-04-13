export type LegacyRecord = Record<string, unknown>;

export interface LegacyTarifaRecord extends LegacyRecord {
  _id?: unknown;
  nombre?: unknown;
  tarifaHora?: unknown;
  tarifaDia?: unknown;
  tarifaLibre?: unknown;
  tarifaBaseHora?: unknown;
  fraccionMinutos?: unknown;
}

export interface LegacyTicketRecord extends LegacyRecord {
  _id?: unknown;
  ticketNumber?: unknown;
  ticketId?: unknown;
  patente?: unknown;
  categoria?: unknown;
  cliente?: unknown;
  tarifaId?: unknown;
  operadorId?: unknown;
  operatorId?: unknown;
  horaEntrada?: unknown;
  ingreso?: unknown;
  horaSalida?: unknown;
  salida?: unknown;
  estado?: unknown;
  totalCobrado?: unknown;
  total?: unknown;
  metodoPago?: unknown;
  tipoEstadia?: unknown;
  cantidadHoras?: unknown;
  cantidadDias?: unknown;
  cantidad?: unknown;
  tarifaBaseHora?: unknown;
  tarifa?: unknown;
  notas?: unknown;
  prepago?: unknown;
  detalleCobro?: unknown;
  tiempoTotal?: unknown;
}

export interface LegacyLiquidacionRecord extends LegacyRecord {
  efectivo?: unknown;
  tarjeta?: unknown;
  otros?: unknown;
  totalDeclarado?: unknown;
  fechaLiquidacion?: unknown;
}

export interface LegacyTurnoRecord extends LegacyRecord {
  _id?: unknown;
  operatorId?: unknown;
  fechaApertura?: unknown;
  fechaCierre?: unknown;
  tickets?: unknown;
  totalTurno?: unknown;
  estado?: unknown;
  liquidacion?: unknown;
  observaciones?: unknown;
  numeroCaja?: unknown;
}
