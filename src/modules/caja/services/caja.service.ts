import type {
  IngresoPayload,
  LiquidacionPayload,
  SalidaPayload,
  TicketCaja,
  TurnoCaja,
} from '../types/caja.types';
import { adaptTicketFromLegacy } from '../adapters/ticket.adapter';
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

export async function fetchTurnoActual(operatorId: string): Promise<TurnoCaja | null> {
  const res = await fetch(`/api/v2/turno?operatorId=${encodeURIComponent(operatorId)}`, {
    cache: 'no-store',
  });
  const json = await ensureOk(res);
  return json ? adaptTurnoFromLegacy(json) : null;
}

export async function abrirTurno(operatorId: string): Promise<TurnoCaja> {
  const res = await fetch('/api/v2/turno/abrir', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operatorId }),
  });

  const json = await ensureOk(res);
  return adaptTurnoFromLegacy(json);
}

export async function cerrarTurno(operatorId: string): Promise<void> {
  const res = await fetch('/api/v2/turno/cerrar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operatorId }),
  });

  await ensureOk(res);
}

export async function liquidarTurno(
  operatorId: string,
  payload: LiquidacionPayload,
): Promise<TurnoCaja> {
  const res = await fetch('/api/v2/turno/liquidar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operatorId, ...payload }),
  });

  const json = await ensureOk(res);
  return adaptTurnoFromLegacy(json);
}

export async function registrarIngreso(
  payload: IngresoPayload & { operatorId: string; horaEntrada: string },
): Promise<TicketCaja> {
  const res = await fetch('/api/v2/caja/ingreso', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const json = await ensureOk(res);
  return adaptTicketFromLegacy(json?.ticket ?? json);
}

export async function obtenerSalida(ticketNumber: string): Promise<TicketCaja | null> {
  const res = await fetch(`/api/v2/caja/salida?ticketNumber=${encodeURIComponent(ticketNumber)}`, {
    cache: 'no-store',
  });
  const json = await ensureOk(res);
  return json ? adaptTicketFromLegacy(json) : null;
}

export async function registrarSalida(payload: SalidaPayload): Promise<TicketCaja> {
  const res = await fetch('/api/v2/caja/salida', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const json = await ensureOk(res);
  return adaptTicketFromLegacy(json?.ticket ?? json);
}

export async function modificarSalida(
  ticketNumber: string,
  cambios: Partial<SalidaPayload>,
): Promise<TicketCaja> {
  const res = await fetch('/api/v2/caja/salida', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticketNumber, ...cambios }),
  });

  const json = await ensureOk(res);
  return adaptTicketFromLegacy(json?.ticket ?? json);
}
