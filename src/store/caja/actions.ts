// Simple local store actions for caja state. This is intentionally lightweight and uses localStorage
export const CAJA_STATE_KEY = 'app:caja_state_v1';

export type CajaState = {
  turnoId?: string | null;
  parkinglotId?: string | null;
  cajaNumero?: number | null;
  openedAt?: string | null;
};

export function loadCajaState(): CajaState {
  try {
    const raw = localStorage.getItem(CAJA_STATE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as CajaState;
  } catch {
    return {};
  }
}

export function saveCajaState(state: CajaState) {
  try {
    localStorage.setItem(CAJA_STATE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function clearCajaState() {
  try {
    localStorage.removeItem(CAJA_STATE_KEY);
  } catch {
    // ignore
  }
}
