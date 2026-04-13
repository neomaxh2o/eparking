// interfaces/estadias.ts
import type { TipoEstadia } from '@/interfaces/Tarifa/tarifa';

export type Categoria = 'Automóvil' | 'Motocicleta' | 'Camioneta' | 'Bicicleta' | 'Otros';
export type EstadoEstadia = 'activa' | 'cerrada' | 'prepago';
export type MetodoPago = 'efectivo' | 'tarjeta' | 'qr' | 'otros';

// Datos opcionales del cliente
export interface Cliente {
  nombre?: string;
  apellido?: string;
  dni?: string;
  telefono?: string;
}

// Payload para crear o actualizar una estadía
export interface EstadiaPayload {
  _id?: string; // solo para actualizar
  ticketNumber: string;
  patente: string;
  categoria: Categoria;
  cliente?: Cliente;
  tarifaId: string;
  operadorId: string;
  horaEntrada?: string | Date;
  horaSalida?: string | Date;
  estado?: EstadoEstadia;
  totalCobrado?: number;
  metodoPago?: MetodoPago;
  tipoEstadia: TipoEstadia;
  cantidadHoras?: number;
  cantidadDias?: number;
  cantidadMeses?: number;
  prepago?: boolean;
}

// Interfaz que representa una estadía completa (como la devuelve la API)
export interface IEstadia {
  _id: string;
  ticket: string;
  patente: string;
  operadorId: string;
  parkinglotId: string;
  categoria: string;
  tipoEstadia: 'hora' | 'dia' | 'mensual' | 'libre';
  cantidadHoras?: number;
  cantidadDias?: number;
  cantidadMeses?: number;
  precioUnitario: number;
  bonificacionPorc: number;
  precioConDescuento: number;
  precioTotal: number;
  horaEntrada?: string;
  horaSalida?: string;
  estado?: string;
  prepago?: boolean;
  totalCobrado?: number;
  metodoPago?: 'efectivo' | 'tarjeta' | 'qr';
  plazaAsignadaId?: string;
  subplazaAsignadaNumero?: number;
}

// ✅ Interfaz para EstadiasContext
export interface EstadiasContextType {
  estadias: IEstadia[];
  refresh: () => Promise<void>;
  loading: boolean;
}
