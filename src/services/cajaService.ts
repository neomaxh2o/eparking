export const DEBUG_PARKING = !!process.env.DEBUG_PARKING;

type CajaDisponible = {
  _id: string;
  parkinglotId: string;
  numero: number;
  code?: string;
  displayName?: string;
  tipo?: string;
  activa?: boolean;
};

async function resolveCajaAdministrativaNumero(parkinglotId: string, requestedCajaNumero?: number | null) {
  if (requestedCajaNumero != null && requestedCajaNumero !== 0) return Number(requestedCajaNumero);

  const res = await fetch(`/api/v2/billing/cajas?parkinglotId=${encodeURIComponent(parkinglotId)}`, {
    cache: 'no-store',
    credentials: 'include',
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error || 'Error fetching cajas');

  const cajas = Array.isArray(json) ? (json as CajaDisponible[]) : [];
  const cajasValidas = cajas
    .filter((caja) => caja?.activa !== false)
    .filter((caja) => ['administrativa', 'mixta'].includes(String(caja?.tipo ?? 'operativa')))
    .sort((a, b) => a.numero - b.numero);

  if (!cajasValidas.length) {
    throw new Error('No hay caja administrativa activa para esta playa. Creala primero desde Flujo Operativo.');
  }

  return Number(cajasValidas[0].numero);
}

export async function createCajaAdministrativa({ parkinglotId, cajaNumero, operatorName }: { parkinglotId: string; cajaNumero?: number | null; operatorName?: string }) {
  if (DEBUG_PARKING) console.debug('createCajaAdministrativa', { parkinglotId, cajaNumero, operatorName });

  const effectiveCaja = await resolveCajaAdministrativaNumero(parkinglotId, cajaNumero);

  const res = await fetch('/api/v2/billing/admin-cash', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ parkinglotId, cajaNumero: effectiveCaja, esCajaAdministrativa: true, operatorName }),
    credentials: 'include',
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error || 'Error creating caja administrativa');
  return json.turno ?? json;
}

export async function getCajaActual(parkinglotId?: string) {
  if (DEBUG_PARKING) console.debug('getCajaActual', { parkinglotId });
  const url = parkinglotId ? `/api/v2/billing/admin-cash?parkinglotId=${encodeURIComponent(parkinglotId)}` : '/api/v2/billing/admin-cash';
  const res = await fetch(url, { cache: 'no-store', credentials: 'include' });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error || 'Error fetching caja');
  return json.turno ?? json;
}

export async function closeCaja(turnoId: string) {
  if (DEBUG_PARKING) console.debug('closeCaja', { turnoId });
  const res = await fetch('/api/v2/billing/admin-cash', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ turnoId, action: 'close' }), credentials: 'include',
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error || 'Error closing caja');
  return json;
}
