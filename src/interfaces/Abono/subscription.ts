import { ParkingRef } from '@/interfaces/user';

export type TipoAbono = 'mensual' | 'dia';

export interface ISubscription {
  _id?: string;
  userId: string;
  assignedParking?: string; // ¡Solo string! Para evitar errores
  subPlazaNumero?: number;
  medioAcceso?: 'ticket' | 'tarjeta-rfid' | 'llavero-rfid';
  idMedioAcceso?: string;
  fechaAlta?: string;
  vigenciaHasta?: string;
  tipoPago?: 'efectivo' | 'tarjeta' | 'transferencia';
  tipoAbono?: TipoAbono;
  categoriaVehiculo?: string;
  tipoTarifa?: string;
  periodoExtension?: number;
  patenteVehiculo?: string;
  // NUEVOS CAMPOS
  operadorId?: string;
  tarifaId?: string;
  
   parkingId?: string;
}

