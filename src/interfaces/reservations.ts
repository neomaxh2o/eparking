// src/interfaces/reservation.ts

import { Categoria } from '@/interfaces/tarifa';

export interface User {
  name?: string;
  email?: string;
}

export type ParkingLotType =
  | string
  | { _id: string; name: string }
  | { _id: string; name: string; location: { address: string; lat: number; lng: number } };

export interface Reservation {
  _id: string;
  user: string | User;

  parkingLot: ParkingLotType;

  // Datos del cliente
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string;
  ciudad: string;
  domicilio: string;

  // Datos del vehículo
  patenteVehiculo: string;
  modeloVehiculo: string;

  // Otros datos
  formaPago: string;
  cantidadDias: number;

  // Horarios y estado
  startTime: string;
  endTime: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  amountPaid?: number;
}

// Extensión para usar categoría vehículo en la reserva
export interface ReservationExtended extends Reservation {
  categoriaVehiculo?: Categoria;
}
