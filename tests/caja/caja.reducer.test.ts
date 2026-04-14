import { cajaReducer, initialCajaState } from '@/store/caja/reducer';

describe('cajaReducer', () => {
  it('returns initial state', () => {
    const state = cajaReducer(undefined, { type: 'LOAD' } as any);
    expect(state).toBeDefined();
  });
});
