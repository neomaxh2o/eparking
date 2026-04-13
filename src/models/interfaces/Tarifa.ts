import { Document, Types } from 'mongoose';

export type Categoria = 'Automóvil' | 'Camioneta' | 'Bicicleta' | 'Motocicleta' | 'Otros';
export type TipoEstadia = 'hora' | 'dia' | 'mensual' | 'libre';

// Subdocumentos para cada tipo de tarifa
export interface TarifaHora {
  cantidad: number;               // cantidad de horas
  precioUnitario: number;
  bonificacionPorc?: number;
  precioConDescuento?: number;
  precioTotal: number;
}

export interface TarifaDia {
  cantidad: number;               // cantidad de días
  precioUnitario: number;
  bonificacionPorc?: number;
  precioConDescuento?: number;
  precioTotal: number;
}

export interface TarifaMensual {
  cantidad: number;               // cantidad de meses
  precioUnitario: number;
  bonificacionPorc?: number;
  precioConDescuento?: number;
  precioTotal: number;
}

export interface TarifaLibre {
  precioUnitario: number;
  bonificacionPorc?: number;
  precioConDescuento?: number;
  precioTotal: number;
}

// Documento completo que vive en Mongo
export interface ITarifaDoc extends Document {
  parkinglotId: Types.ObjectId | string;
  category: Categoria;
  tipoEstadia: TipoEstadia;

  tarifasHora?: TarifaHora[];
  tarifasPorDia?: TarifaDia[];
  tarifaMensual?: TarifaMensual[];
  tarifaLibre?: TarifaLibre[];
}
