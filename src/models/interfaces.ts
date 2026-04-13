import { Document, Types } from 'mongoose';

export type Categoria = 'Automóvil' | 'Camioneta' | 'Bicicleta' | 'Motocicleta' | 'Otros';
export type TipoEstadia = 'hora' | 'dia' | 'mensual' | 'libre';

export interface TarifaHora {
  cantidad: number;
  precioUnitario: number;
  bonificacionPorc?: number;
  precioConDescuento?: number;
  precioTotal: number;
}

export interface TarifaDia {
  cantidad: number;
  precioUnitario: number;
  bonificacionPorc?: number;
  precioConDescuento?: number;
  precioTotal: number;
}

export interface TarifaMensual {
  cantidad: number;
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

export interface ITarifaDoc extends Document {
  parkinglotId: Types.ObjectId | string;
  category: Categoria;
  tipoEstadia: TipoEstadia;

  tarifasHora?: TarifaHora[];
  tarifasPorDia?: TarifaDia[];
  tarifaMensual?: TarifaMensual[];
  tarifaLibre?: TarifaLibre[];
}

export interface ParkingLotFromDB {
  _id: string;
  owner: string;
  name: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  totalSpots: number;
  availableSpots: number;
  pricePerHour: number;
  schedule: {
    open: string;
    close: string;
  };
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}
