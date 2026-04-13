export type Categoria = 'Automóvil' | 'Camioneta' | 'Bicicleta' | 'Motocicleta' | 'Otros';
export type TipoEstadia = 'hora' | 'dia' | 'mensual' | 'libre';

// Subdocumentos para cada tipo de tarifa, ahora incluyen tipoEstadia
export interface TarifaHora {
  tipoEstadia: 'hora';
  cantidad: number;               // cantidad de horas
  precioUnitario: number;
  bonificacionPorc?: number;
  precioConDescuento?: number;
  precioTotal: number;
}

export interface TarifaDia {
  tipoEstadia: 'dia';
  cantidad: number;               // cantidad de días
  precioUnitario: number;
  bonificacionPorc?: number;
  precioConDescuento?: number;
  precioTotal: number;
}

export interface TarifaMensual {
  tipoEstadia: 'mensual';
  cantidad: number;               // cantidad de meses
  precioUnitario: number;
  bonificacionPorc?: number;
  precioConDescuento?: number;
  precioTotal: number;
}

export interface TarifaLibre {
  tipoEstadia: 'libre';
  precioUnitario: number;
  bonificacionPorc?: number;
  precioConDescuento?: number;
  precioTotal: number;
}

// Documento que usa el frontend
export interface ITarifa {
  _id: string;
  parkinglotId: string; // ya convertido a string en JSON
  category: Categoria;

  tarifasHora?: TarifaHora[];
  tarifasPorDia?: TarifaDia[];
  tarifaMensual?: TarifaMensual[];
  tarifaLibre?: TarifaLibre[];

  createdAt?: string;
  updatedAt?: string;
}

// Base con datos comunes
export interface SubTarifaBase {
  _id: string;
  category: Categoria;
}

// SubTarifa unificado
export type SubTarifa =
  | (TarifaHora & SubTarifaBase)
  | (TarifaDia & SubTarifaBase)
  | (TarifaMensual & SubTarifaBase)
  | (TarifaLibre & SubTarifaBase);

