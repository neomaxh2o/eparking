export interface FormValues {
  name: string;
  email: string;
  password: string;
  role: 'client' | 'owner' | 'operator' | 'admin' | 'guest';
  assignedParking?: string;
  nombre?: string;
  apellido?: string;
  dni?: string;
  telefono?: string;
  ciudad?: string;
  domicilio?: string;
  patenteVehiculo?: string;
  modeloVehiculo?: string;
  categoriaVehiculo?: string;
  medioAcceso?: string; // <- agrega esta línea
  tipoAbono?: string;
  fechaAlta?: string;
  vigenciaHasta?: string;
  tipoPago?: string;
  tipoTarifa?: string;
  idMedioAcceso?: string;
  periodoExtension?: number;
}
