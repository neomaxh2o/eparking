export const CATEGORIAS_VEHICULO = [
  'Automóvil',
  'Camioneta',
  'Bicicleta',
  'Motocicleta',
  'Otros',
] as const;

export type CategoriaVehiculo = typeof CATEGORIAS_VEHICULO[number];

export const TIPOS_ESTADIA = ['hora', 'dia', 'libre'] as const;
export type TipoEstadia = typeof TIPOS_ESTADIA[number];

export const METODOS_PAGO = ['efectivo', 'tarjeta', 'qr', 'otros'] as const;
export type MetodoPago = typeof METODOS_PAGO[number];

export type EstadoTicket = 'activa' | 'cerrada';
export type EstadoTurno = 'abierto' | 'cerrado' | 'pendiente_liquidacion' | 'liquidado';

export interface ClienteCaja {
  nombre?: string;
  apellido?: string;
  dni?: string;
  telefono?: string;
}

export interface TarifaSnapshot {
  _id?: string;
  nombre?: string;
  tarifaHora?: number;
  tarifaDia?: number;
  tarifaLibre?: number;
  tarifaBaseHora?: number;
  fraccionMinutos?: number;
  tipoEstadiaAplicada?: TipoEstadia;
  cantidadAplicada?: number;
  precioUnitarioAplicado?: number;
  precioTotalAplicado?: number;
}

export interface TicketCaja {
  _id?: string;
  ticketNumber: string;
  patente: string;
  categoria: CategoriaVehiculo;
  cliente?: ClienteCaja;
  tarifaId?: string;
  operadorId?: string;
  horaEntrada: string;
  horaSalida?: string;
  horaExpiracion?: string;
  createdAt?: string;
  updatedAt?: string;
  estado: EstadoTicket;
  totalCobrado?: number;
  metodoPago?: MetodoPago;
  tipoEstadia: TipoEstadia;
  cantidadHoras?: number;
  cantidadDias?: number;
  cantidad?: number;
  tarifaBaseHora?: number;
  tarifa?: TarifaSnapshot;
  notas?: string;
  prepago?: boolean;
  detalleCobro?: string;
  tiempoTotal?: string;
  billingDocumentId?: string;
  billingDocumentCode?: string;
}

export interface LiquidacionTurno {
  efectivo: number;
  tarjeta: number;
  otros: number;
  totalDeclarado: number;
  totalSistema?: number;
  diferencia?: number;
  tipoDiferencia?: 'sin_diferencia' | 'sobrante' | 'faltante';
  observacion?: string;
  fechaLiquidacion: string;
}

export interface TurnoCaja {
  _id: string;
  operatorId: string;
  parkinglotId?: string;
  assignedParking?: string;
  fechaApertura: string;
  fechaCierre?: string;
  tickets: TicketCaja[];
  totalTurno: number;
  estado: EstadoTurno;
  liquidacion?: LiquidacionTurno;
  observaciones?: string;
  numeroCaja: number;
}

export interface IngresoPayload {
  patente: string;
  categoria: CategoriaVehiculo;
  cliente?: ClienteCaja;
  tarifaId?: string;
  tipoEstadia?: TipoEstadia;
  cantidad?: number;
  prepago?: boolean;
  metodoPago?: MetodoPago;
  pagado?: boolean;
  tarifaSeleccionada?: {
    tarifaId: string;
    tipoEstadia: TipoEstadia;
    cantidad: number;
    precioUnitario: number;
    precioTotal: number;
  };
}

export interface SalidaPayload extends Partial<TicketCaja> {
  ticketNumber: string;
}

export interface LiquidacionPayload {
  efectivo: number;
  tarjeta: number;
  otros: number;
  observacion?: string;
}
