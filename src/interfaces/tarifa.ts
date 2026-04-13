// interfaces/tarifa.ts
export interface SubTarifaHora {
  cantidad: number;           // cantidad de horas
  precioUnitario: number;
  bonificacionPorc?: number;
  precioConDescuento?: number;
  precioTotal?: number;
}

export interface SubTarifaDia {
  cantidad: number;           // cantidad de días
  precioUnitario: number;
  bonificacionPorc?: number;
  precioConDescuento?: number;
  precioTotal?: number;
}

export interface SubTarifaMensual {
  cantidad: number;           // cantidad de meses
  precioUnitario: number;
  bonificacionPorc?: number;
  precioConDescuento?: number;
  precioTotal?: number;
}

export interface SubTarifaLibre {
  precioUnitario: number;
  bonificacionPorc?: number;
  precioConDescuento?: number;
  precioTotal?: number;
}

// Esto se usa en TarifaForm
export type SubTarifa = SubTarifaHora | SubTarifaDia | SubTarifaMensual | SubTarifaLibre;
