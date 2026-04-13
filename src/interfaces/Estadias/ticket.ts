// Interfaz base para un Ticket de estadía
export interface ITicket {
  ticket: string; // nro único de ticket
  patente: string; // patente del vehículo
  categoria: string; // categoría del vehículo (auto, moto, camioneta, etc.)
  tipoEstadia: "hora" | "dia" | "mes" | "libre"; // tipo de estadía
  horaEntrada?: string; // fecha/hora entrada (ISO string)
  horaSalida: string; // fecha/hora salida (ISO string)
  precioUnitario: number; // precio por unidad (hora, día, mes, etc.)
  totalCobrado: number; // monto total cobrado al cliente
  metodoPago?: "efectivo" | "tarjeta" | "qr"; // método de pago
  operatorName: string; // nombre del operador que registró el ticket
  parkingName: string; // nombre del estacionamiento
  qrData: {
    code: string; // valor del QR
    [key: string]: any; // extra metadata si tu QR lleva más info
  };
}
