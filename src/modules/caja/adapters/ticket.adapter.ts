import type {
  CategoriaVehiculo,
  MetodoPago,
  TarifaSnapshot,
  TicketCaja,
  TipoEstadia,
} from '../types/caja.types';
import type {
  LegacyRecord,
  LegacyTarifaRecord,
  LegacyTicketRecord,
} from '../types/legacy.types';

function asRecord(value: unknown): LegacyRecord | null {
  return value && typeof value === 'object' ? (value as LegacyRecord) : null;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function normalizeCategoria(value: unknown): CategoriaVehiculo {
  switch (value) {
    case 'auto':
      return 'Automóvil';
    case 'camioneta':
      return 'Camioneta';
    case 'moto':
      return 'Motocicleta';
    case 'bicicleta':
      return 'Bicicleta';
    case 'Automóvil':
    case 'Camioneta':
    case 'Motocicleta':
    case 'Bicicleta':
    case 'Otros':
      return value;
    default:
      return 'Otros';
  }
}

function normalizeTipoEstadia(value: unknown): TipoEstadia {
  if (value === 'hora' || value === 'dia' || value === 'libre') {
    return value;
  }
  return 'libre';
}

function normalizeMetodoPago(value: unknown): MetodoPago | undefined {
  if (value === 'efectivo' || value === 'tarjeta' || value === 'qr' || value === 'otros') {
    return value;
  }
  return undefined;
}

function toIsoString(value: unknown): string | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function normalizeTarifa(value: unknown): TarifaSnapshot | undefined {
  const raw = asRecord(value) as LegacyTarifaRecord | null;
  if (!raw) return undefined;

  return {
    _id: asString(raw._id),
    nombre: asString(raw.nombre),
    tarifaHora: asNumber(raw.tarifaHora),
    tarifaDia: asNumber(raw.tarifaDia),
    tarifaLibre: asNumber(raw.tarifaLibre),
    tarifaBaseHora: asNumber(raw.tarifaBaseHora),
    fraccionMinutos: asNumber(raw.fraccionMinutos),
  };
}

export function adaptTicketFromLegacy(input: unknown): TicketCaja {
  const raw = (asRecord(input) ?? {}) as LegacyTicketRecord;
  const tarifaIdRecord = asRecord(raw.tarifaId);

  const tarifa = normalizeTarifa(raw.tarifa);
  const precioTotalAplicado = asNumber((raw.tarifa as LegacyRecord | undefined)?.precioTotalAplicado);
  const precioUnitarioAplicado = asNumber((raw.tarifa as LegacyRecord | undefined)?.precioUnitarioAplicado);
  const cantidadAplicada = asNumber((raw.tarifa as LegacyRecord | undefined)?.cantidadAplicada);
  const tipoEstadiaAplicada = normalizeTipoEstadia((raw.tarifa as LegacyRecord | undefined)?.tipoEstadiaAplicada);

  return {
    _id: asString(raw._id),
    ticketNumber: String(raw.ticketNumber ?? raw.ticketId ?? ''),
    patente: String(raw.patente ?? '').toUpperCase(),
    categoria: normalizeCategoria(raw.categoria),
    cliente:
      raw.cliente && typeof raw.cliente === 'object'
        ? (raw.cliente as TicketCaja['cliente'])
        : undefined,
    tarifaId: asString(raw.tarifaId) ?? asString(tarifaIdRecord?._id),
    operadorId: asString(raw.operadorId) ?? asString(raw.operatorId),
    horaEntrada: toIsoString(raw.horaEntrada ?? raw.ingreso) ?? new Date().toISOString(),
    horaSalida: toIsoString(raw.horaSalida ?? raw.salida),
    horaExpiracion: toIsoString(raw.horaExpiracion),
    createdAt: toIsoString(raw.createdAt),
    updatedAt: toIsoString(raw.updatedAt),
    estado:
      raw.estado === 'finalizado' || raw.estado === 'cerrada'
        ? 'cerrada'
        : 'activa',
    totalCobrado: asNumber(raw.totalCobrado) ?? asNumber(raw.total),
    metodoPago: normalizeMetodoPago(raw.metodoPago),
    tipoEstadia: normalizeTipoEstadia(raw.tipoEstadia),
    cantidadHoras: asNumber(raw.cantidadHoras),
    cantidadDias: asNumber(raw.cantidadDias),
    cantidad: asNumber(raw.cantidad),
    tarifaBaseHora: asNumber(raw.tarifaBaseHora),
    tarifa: tarifa
      ? {
          ...tarifa,
          precioTotalAplicado,
          precioUnitarioAplicado,
          cantidadAplicada,
          tipoEstadiaAplicada,
        }
      : tarifa,
    notas: asString(raw.notas),
    prepago: Boolean(raw.prepago),
    detalleCobro: asString(raw.detalleCobro),
    tiempoTotal: asString(raw.tiempoTotal),
  };
}
