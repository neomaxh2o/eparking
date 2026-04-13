'use client';

/**
 * @deprecated Use `@/modules/caja/hooks/useIngresoCaja` directly.
 * Legacy compatibility layer. Do not use in new code.
 */
export { useIngresoCaja as useIngreso } from '@/modules/caja/hooks/useIngresoCaja';
export { CATEGORIAS_VEHICULO as categorias } from '@/modules/caja/types/caja.types';

import type {
  CategoriaVehiculo,
  ClienteCaja,
  IngresoPayload,
  TipoEstadia,
} from '@/modules/caja/types/caja.types';

export type Categoria = CategoriaVehiculo;
export type Cliente = ClienteCaja;
export type IngresoData = IngresoPayload;
export type { TipoEstadia };

export interface FormIngreso {
  patente: string;
  categoria: CategoriaVehiculo;
  tipoEstadia: TipoEstadia;
  horaEntrada: string;
  tarifaId?: string;
  cantidadHoras?: number;
  cantidadDias?: number;
  montoEstimado?: number;
}
