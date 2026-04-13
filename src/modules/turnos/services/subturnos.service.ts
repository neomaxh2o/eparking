import { adaptTurnoFromLegacy } from '@/modules/turnos/adapters/turno.adapter';
import type { TurnoCaja } from '@/modules/caja/types/caja.types';

async function parseJsonSafe(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function ensureOk(res: Response) {
  const json = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(json?.error || json?.message || 'Error de servidor');
  }
  return json;
}

export async function cerrarSubturno(operatorId: string): Promise<TurnoCaja> {
  const res = await fetch('/api/v2/turno/cerrar-subturno', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operatorId }),
  });

  const json = await ensureOk(res);
  return adaptTurnoFromLegacy(json.cerradoOperativamente);
}

export async function obtenerPendientes(operatorId: string): Promise<TurnoCaja[]> {
  const res = await fetch(
    `/api/v2/turno/pendientes?operatorId=${encodeURIComponent(operatorId)}`,
    { cache: 'no-store' }
  );

  const json = await ensureOk(res);
  return Array.isArray(json) ? json.map(adaptTurnoFromLegacy) : [];
}

export async function liquidarSubturno(
  operatorId: string,
  turnoId: string,
  payload: { efectivo: number; tarjeta: number; otros: number; observacion?: string }
): Promise<TurnoCaja> {
  const res = await fetch('/api/v2/turno/liquidar-subturno', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operatorId, turnoId, ...payload }),
  });

  const json = await ensureOk(res);
  return adaptTurnoFromLegacy(json);
}

export async function cerrarPendiente(
  operatorId: string,
  turnoId: string,
): Promise<TurnoCaja> {
  const res = await fetch('/api/v2/turno/cerrar-pendiente', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operatorId, turnoId }),
  });

  const json = await ensureOk(res);
  return adaptTurnoFromLegacy(json);
}
