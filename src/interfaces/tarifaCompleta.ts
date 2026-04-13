// interfaces/tarifaCompleta.ts
import type { Tarifa, TarifaDia, Categoria, TipoEstadia } from './tarifa';

export interface TarifaCompleta {
  _id: string;
  nombre: string;          // podemos usar category como nombre si no hay otro
  category: Categoria;
  tipoEstadia: TipoEstadia;
  tarifaHora: number;
  cantidadHoras?: number;
  discountPercentHora?: number;
  precioConDescuentoHora?: number;
  tarifasPorDia: TarifaDia[];
  monto?: number;          // campo extra para el total calculado si querés
}

/**
 * Función de utilidad para construir un TarifaCompleta a partir de Tarifa
 */
export function construirTarifaCompleta(t: Tarifa): TarifaCompleta {
  return {
    _id: t._id ?? '',                 // asegurar que siempre tenga _id
    nombre: t.category,               // usar category como nombre por defecto
    category: t.category,
    tipoEstadia: t.tipoEstadia,
    tarifaHora: t.tarifaHora,
    cantidadHoras: t.cantidadHoras,
    discountPercentHora: t.discountPercentHora,
    precioConDescuentoHora: t.precioConDescuentoHora,
    tarifasPorDia: t.tarifasPorDia ?? [],
    monto: t.tarifaHora,             // opcional, solo ejemplo
  };
}
