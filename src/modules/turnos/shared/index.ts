/**
 * Shared helpers for admin cash / turnos.
 * All monetary values are represented in cents (integers).
 */

export type Turno = {
  id?: string;
  _id?: string;
  tipo?: string; // 'parking' | 'venta' | etc
  cajaNumero?: number | null;
  numeroCaja?: number | null;
  assignedParking?: string | null;
  abierto?: boolean;
  [k: string]: any;
};

/**
 * Simple logger used by admin panel logic.
 * DEBUG_PARKING semantics preserved: use logger.debug to emit parking debug lines.
 */
export const logger = {
  debug: (...args: any[]) => {
    try {
      if (process.env.DEBUG_PARKING || process.env.DEBUG === 'true') {
        // eslint-disable-next-line no-console
        console.debug('[DEBUG_PARKING]', ...args);
      }
    } catch (e) {
      // noop
    }
  },
};

/**
 * Convert decimal amount (e.g. 12.34) into integer cents (1234).
 * Accepts number or string input.
 */
export function toCents(amount: number | string | null | undefined): number {
  if (amount == null || amount === '') return 0;
  const n = typeof amount === 'string' ? parseFloat(amount.replace(/,/g, '.')) : Number(amount);
  if (Number.isNaN(n) || !isFinite(n)) return 0;
  // Heurística: si ya es entero grande (>1000) lo tratamos como cents ya presentes
  if (Number.isInteger(n) && Math.abs(n) > 1000) return n;
  return Math.round(n * 100);
}

/**
 * Convert cents integer into decimal number (e.g. 1234 -> 12.34).
 */
export function fromCents(cents: number | null | undefined): number {
  const c = Number(cents || 0);
  return c / 100;
}

/**
 * Return true when the turno represents a parking turno (affects UI gating).
 */
export function isTurnoForParking(turno?: Turno | null, parkinglotId?: string | null): boolean {
  if (!turno) return false;
  if (parkinglotId && (turno.assignedParking || turno.parkinglotId)) {
    try {
      return String(turno.assignedParking || turno.parkinglotId).trim() === String(parkinglotId).trim();
    } catch (e) {
      // fallback
    }
  }
  const t = (turno.tipo || '').toString().toLowerCase();
  return t === 'parking' || t.includes('parking');
}

/**
 * Thin adapters for admin cash operations.
 * These wrapper functions call the existing API endpoints used by the app.
 * They are written defensively and emit logger.debug.
 */

export async function getAdminCashTurno(parkinglotId?: string): Promise<Turno | null> {
  try {
    const params = new URLSearchParams();
    if (parkinglotId) params.set('parkinglotId', parkinglotId);
    const url = `/api/v2/billing/admin-cash${params.toString() ? `?${params.toString()}` : ''}`;
    logger.debug('getAdminCashTurno', url);
    const res = await fetch(url);
    const data = await res.json();
    logger.debug('getAdminCashTurno:resp', data);
    return data?.turno ?? null;
  } catch (e) {
    logger.debug('getAdminCashTurno:error', e);
    return null;
  }
}

export async function openAdminCashTurno(opts: { parkinglotId?: string | null; cajaNumero?: number | null; label?: string } = {}) {
  try {
    const body = { parkinglotId: opts.parkinglotId ?? null, cajaNumero: opts.cajaNumero ?? null, label: opts.label ?? 'parking' };
    logger.debug('openAdminCashTurno:body', body);
    const res = await fetch('/api/v2/billing/admin-cash', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'openAdminCashTurno failed');
    logger.debug('openAdminCashTurno:ok', data);
    return data.turno;
  } catch (e) {
    logger.debug('openAdminCashTurno:error', e);
    throw e;
  }
}

export async function closeAdminCashTurno(turnoId: string) {
  try {
    logger.debug('closeAdminCashTurno', turnoId);
    const res = await fetch('/api/v2/billing/admin-cash', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ turnoId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'closeAdminCashTurno failed');
    logger.debug('closeAdminCashTurno:ok', data);
    return data;
  } catch (e) {
    logger.debug('closeAdminCashTurno:error', e);
    throw e;
  }
}

export async function fetchCajasDisponibles(parkinglotId?: string): Promise<Array<{ numero: number }>> {
  try {
    const params = new URLSearchParams();
    if (parkinglotId) params.set('parkinglotId', parkinglotId);
    const url = `/api/v2/billing/cajas${params.toString() ? `?${params.toString()}` : ''}`;
    logger.debug('fetchCajasDisponibles', url);
    const res = await fetch(url);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    logger.debug('fetchCajasDisponibles:error', e);
    return [];
  }
}

export function resolveCajaFallback(requestedCaja?: number | null, available: Array<{ numero: number }> = []): number | null {
  try {
    if (requestedCaja != null && available.some((a) => a.numero === requestedCaja)) return requestedCaja;
    if (available.length > 0) return available[0].numero;
    return null;
  } catch (e) {
    return null;
  }
}
