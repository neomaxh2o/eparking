export const DEBUG_PARKING = !!process.env.DEBUG_PARKING;

export async function createCajaAdministrativa({ parkinglotId, cajaNumero, operatorName }: { parkinglotId: string; cajaNumero?: number | null; operatorName?: string }) {
  if (DEBUG_PARKING) console.debug('createCajaAdministrativa', { parkinglotId, cajaNumero, operatorName });
  // If cajaNumero not provided, derive from parkinglotId using digit-only last-5 rule (fallback automatic)
  let effectiveCaja = cajaNumero ?? null;
  if ((effectiveCaja == null || effectiveCaja === '') && parkinglotId) {
    try {
      const digits = String(parkinglotId).replace(/\D/g, '');
      const last5 = digits.slice(-5);
      effectiveCaja = last5 ? Number(last5) : 1;
    } catch (e) {
      effectiveCaja = 1;
    }
  }

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
