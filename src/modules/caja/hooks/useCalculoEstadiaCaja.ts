'use client';

import { useMemo } from 'react';
import { calcularDiffMin, calcularEstadia, calcularTiempoTotal } from '../utils/calculoEstadia';

export function useCalculoEstadiaCaja() {
  return useMemo(
    () => ({
      calcularEstadia,
      calcularDiffMin,
      calcularTiempoTotal,
    }),
    [],
  );
}
