import type { TurnoEventoRow } from '@/modules/turnos/hooks/useTurnoEventos';

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

export async function obtenerEventosTurno(operatorId: string): Promise<TurnoEventoRow[]> {
  const res = await fetch(`/api/caja/turno/eventos?operatorId=${encodeURIComponent(operatorId)}`, {
    cache: 'no-store',
  });

  const json = await ensureOk(res);
  return Array.isArray(json?.items) ? (json.items as TurnoEventoRow[]) : [];
}
