import { adaptTicketFromLegacy } from '@/modules/caja/adapters/ticket.adapter';
import type { TurnoCaja } from '@/modules/caja/types/caja.types';
import type {
  LegacyLiquidacionRecord,
  LegacyTurnoRecord,
} from '@/modules/caja/types/legacy.types';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function toIsoString(value: unknown): string | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export function adaptTurnoFromLegacy(input: unknown): TurnoCaja {
  const raw = (asRecord(input) ?? {}) as LegacyTurnoRecord;
  const liquidacionRaw = asRecord(raw.liquidacion) as LegacyLiquidacionRecord | null;
  const estadoRaw = String(raw.estado ?? '').toLowerCase();
  const estadoMap: Record<string, TurnoCaja['estado']> = {
    pendiente_liquidacion: 'pendiente_liquidacion',
    pendiente: 'pendiente_liquidacion',
    abierto: 'abierto',
    en_curso: 'abierto',
    cerrado: 'cerrado',
    liquidado: 'liquidado',
  };
  const estado = estadoMap[estadoRaw] ?? 'abierto';

  return {
    _id: String(raw._id ?? ''),
    operatorId: String(raw.operatorId ?? ''),
    codigoTurno: asString(raw.codigoTurno) ?? asString(raw.codigo) ?? '',
    numeroTurno: asNumber(raw.numeroTurno) ?? asNumber(raw.numero) ?? asNumber(raw.subturnoNumero) ?? 0,
    parkinglotId: asString(raw.parkinglotId) ?? asString(raw.assignedParking),
    assignedParking: asString(raw.assignedParking) ?? asString(raw.parkinglotId),
    fechaApertura: toIsoString(raw.fechaApertura) ?? new Date().toISOString(),
    fechaCierre: toIsoString(raw.fechaCierre),
    tickets: Array.isArray(raw.tickets) ? raw.tickets.map(adaptTicketFromLegacy) : [],
    totalTurno: asNumber(raw.totalTurno) ?? 0,
    estado,
    liquidacion: liquidacionRaw
      ? {
          efectivo: asNumber(liquidacionRaw.efectivo) ?? 0,
          tarjeta: asNumber(liquidacionRaw.tarjeta) ?? 0,
          otros: asNumber(liquidacionRaw.otros) ?? 0,
          totalDeclarado: asNumber(liquidacionRaw.totalDeclarado) ?? 0,
          totalSistema: asNumber(liquidacionRaw.totalSistema) ?? 0,
          diferencia: asNumber(liquidacionRaw.diferencia) ?? 0,
          tipoDiferencia:
            liquidacionRaw.tipoDiferencia === 'sobrante' ||
            liquidacionRaw.tipoDiferencia === 'faltante' ||
            liquidacionRaw.tipoDiferencia === 'sin_diferencia'
              ? liquidacionRaw.tipoDiferencia
              : 'sin_diferencia',
          observacion: asString(liquidacionRaw.observacion),
          fechaLiquidacion:
            toIsoString(liquidacionRaw.fechaLiquidacion) ?? new Date().toISOString(),
        }
      : undefined,
    observaciones: asString(raw.observaciones),
    numeroCaja: asNumber(raw.numeroCaja) ?? 0,
  };
}
