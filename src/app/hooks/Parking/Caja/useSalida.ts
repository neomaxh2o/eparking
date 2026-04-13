'use client';

/**
 * @deprecated Use `@/modules/caja/hooks/useSalidaCaja` directly.
 * Legacy compatibility layer. Do not use in new code.
 */
export { useSalidaCaja as useSalida } from '@/modules/caja/hooks/useSalidaCaja';
export type {
  CategoriaVehiculo as Categoria,
  MetodoPago,
  TarifaSnapshot as Tarifa,
  TicketCaja as SalidaData,
} from '@/modules/caja/types/caja.types';
