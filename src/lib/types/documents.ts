// Minimal shared mongoose document interfaces used for lean<T>() results

export interface TurnoDoc {
  _id: string;
  parkinglotId?: string;
  assignedParking?: string | { _id?: string; name?: string };
  cajaId?: string;
  cajaCode?: string;
  numeroCaja?: number | string;
  numeroTurno?: number;
  codigoTurno?: string;
  estado?: string;
  fechaApertura?: string | Date;
  fechaCierre?: string | Date;
  [key: string]: unknown;
}

export interface CajaDoc {
  _id: string;
  code?: string;
  numero?: number;
  parkinglotId?: string;
  [key: string]: unknown;
}

export interface AbonadoDoc {
  _id: string;
  nombre?: string;
  apellido?: string;
  dni?: string;
  telefono?: string;
  email?: string;
  assignedParking?: string | { _id?: string; name?: string } | null;
  numeroAbonado?: number;
  vehiculos?: Array<{ patente?: string }>;
  [key: string]: unknown;
}

export interface InvoiceDoc {
  _id: string;
  abonadoId?: string;
  monto?: number;
  estado?: string;
  fechaEmision?: string | Date;
  fechaVencimiento?: string | Date | null;
  fechaPago?: string | Date | null;
  paymentMethod?: string;
  paymentReference?: string;
  [key: string]: unknown;
}
