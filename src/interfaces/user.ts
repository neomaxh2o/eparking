// /interfaces/user.ts

export type CategoriaVehiculo = 'Automóvil' | 'Camioneta' | 'Bicicleta' | 'Motocicleta' | 'Otros';
export type MedioAcceso = 'ticket' | 'tarjeta-rfid' | 'llavero-rfid';
export type TipoAbono = 'mensual' | 'dia' | 'hora';
export type TipoPago = 'efectivo' | 'tarjeta' | 'transferencia';


export interface ParkingRef {
  _id: string;
  name: string;
  
}

export interface User {
  _id: string;
  name?: string;
  nombre?: string;
  apellido?: string;
  email?: string;
  role?: 'client' | 'owner' | 'operator' | 'admin' | 'guest';
  
  // Parking asignado
  assignedParking?: string | ParkingRef; // puede ser ID o objeto
  assignedParkingId?: string | null;     // solo ID, útil para filtrado y select
  
  // Datos personales / vehículo
  dni?: string;
  telefono?: string;
  ciudad?: string;
  domicilio?: string;
  patenteVehiculo?: string;
  modeloVehiculo?: string;
  categoriaVehiculo?: CategoriaVehiculo;
  condicionFiscal?: 'responsable_inscripto' | 'monotributo' | 'exento' | 'consumidor_final' | 'no_categorizado';
  tipoDocumentoFiscal?: 'dni' | 'cuit' | 'otro';
  numeroDocumentoFiscal?: string;
  razonSocial?: string;
  puntoDeVenta?: string;

  // Campos relacionados a abonos/servicios
  medioAcceso?: MedioAcceso;
  tipoAbono?: TipoAbono;
  fechaAlta?: string; // datetime-local en frontend, Date en DB
  vigenciaHasta?: string;
  tipoPago?: TipoPago;
  tipoTarifa?: string;
  idMedioAcceso?: string;
  periodoExtension?: number;

  // Timestamps opcionales
  createdAt?: string;
  updatedAt?: string;
}
