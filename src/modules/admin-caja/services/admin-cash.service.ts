import { adaptTurnoFromLegacy } from '@/modules/turnos/adapters/turno.adapter';

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

export async function fetchTurnoAdminActual(parkinglotId?: string): Promise<any | null> {
  const url = parkinglotId ? `/api/v2/billing/admin-cash?parkinglotId=${encodeURIComponent(parkinglotId)}` : '/api/v2/billing/admin-cash';
  const res = await fetch(url, {
    cache: 'no-store',
    credentials: 'include',
  });
  const json = await ensureOk(res);
  return json ? adaptTurnoFromLegacy(json.turno ?? json) : null;
}

export async function abrirTurnoAdmin(payload: { parkinglotId: string; esCajaAdministrativa?: boolean; operatorName?: string }): Promise<any> {
  const res = await fetch('/api/v2/billing/admin-cash', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  const json = await ensureOk(res);
  return adaptTurnoFromLegacy(json.turno ?? json);
}

export async function cerrarTurnoAdmin(turnoId: string): Promise<void> {
  if (!turnoId) throw new Error('turnoId es requerido');
  const res = await fetch('/api/v2/billing/admin-cash', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ turnoId, action: 'close' }),
    credentials: 'include',
  });
  await ensureOk(res);
}

export async function liquidarTurnoAdmin(turnoId: string, payload: { operatorId?: string; totalDeclarado?: number; observado?: string; observacion?: string }): Promise<any> {
  const res = await fetch('/api/v2/turno/liquidar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ turnoId, ...payload }),
    credentials: 'include',
  });
  const json = await ensureOk(res);
  return adaptTurnoFromLegacy(json.turno ?? json);
}

export async function registrarCobroAdmin(payload: { turnoId: string; monto: number; paymentMethod?: string; descripcion?: string }) {
  const idOperacion = `${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
  const body = { ...payload, idOperacion };
  const res = await fetch('/api/v2/billing/admin-cash/transaction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  });
  const json = await ensureOk(res);
  return json;
}

export async function fetchLiquidacionTurno(turnoId: string) {
  const res = await fetch(`/api/v2/turno/${encodeURIComponent(turnoId)}/liquidacion`, {
    cache: 'no-store',
    credentials: 'include',
  });
  return ensureOk(res);
}
