import { CajaState, loadCajaState, saveCajaState, clearCajaState } from './actions';

export type CajaAction =
  | { type: 'OPENED'; payload: CajaState }
  | { type: 'CLOSED' }
  | { type: 'LOAD' };

export const initialCajaState: CajaState = loadCajaState();

export function cajaReducer(state: CajaState = initialCajaState, action: CajaAction): CajaState {
  switch (action.type) {
    case 'OPENED': {
      const next = { ...state, ...action.payload };
      saveCajaState(next);
      return next;
    }
    case 'CLOSED': {
      clearCajaState();
      return {};
    }
    case 'LOAD': {
      const loaded = loadCajaState();
      return loaded;
    }
    default:
      return state;
  }
}
