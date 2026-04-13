import Ticket, { ITicket } from '@/models/Ticket';
import type { Types } from 'mongoose';

export type TicketIdentity = {
  ticketNumber: string;
  turnoId?: Types.ObjectId | string;
  operadorId?: Types.ObjectId | string;
  tarifaId?: Types.ObjectId | string;
};

export type TicketCreateInput = {
  ticketNumber: string;
  patente: string;
  categoria: ITicket['categoria'];
  cliente?: ITicket['cliente'];
  tarifaId?: ITicket['tarifaId'];
  operadorId?: ITicket['operadorId'];
  horaEntrada?: Date;
  tipoEstadia?: ITicket['tipoEstadia'];
  cantidad?: number;
  cantidadHoras?: number;
  cantidadDias?: number;
  tarifaBaseHora?: number;
  tarifa?: ITicket['tarifa'];
  prepago?: boolean;
  turnoId?: ITicket['turnoId'];
  totalCobrado?: number;
  metodoPago?: ITicket['metodoPago'];
  detalleCobro?: string;
};

export type TicketCloseInput = {
  ticketNumber: string;
  horaSalida?: Date;
  totalCobrado?: number;
  metodoPago?: ITicket['metodoPago'];
  detalleCobro?: string;
  tiempoTotal?: string;
  tarifa?: ITicket['tarifa'];
  tarifaBaseHora?: number;
  cantidadHoras?: number;
  cantidadDias?: number;
  prepago?: boolean;
};

export type TicketUpdateInput = Partial<{
  patente: string;
  categoria: ITicket['categoria'];
  tipoEstadia: ITicket['tipoEstadia'];
  metodoPago: ITicket['metodoPago'];
  totalCobrado: number;
  detalleCobro: string;
  tiempoTotal: string;
  horaSalida: Date;
  estado: ITicket['estado'];
  tarifaId: ITicket['tarifaId'];
  tarifa: ITicket['tarifa'];
  prepago: boolean;
  cantidad: number;
  cantidadHoras: number;
  cantidadDias: number;
  billingDocumentId: ITicket['billingDocumentId'];
  billingDocumentCode: string;
}>;

function normalizePatente(value: string) {
  return String(value || '').trim().toUpperCase();
}

export async function getTicketByNumber(ticketNumber: string) {
  return Ticket.findOne({ ticketNumber });
}

export async function createTicket(input: TicketCreateInput) {
  return Ticket.create({
    ticketNumber: input.ticketNumber,
    patente: normalizePatente(input.patente),
    categoria: input.categoria,
    cliente: input.cliente,
    tarifaId: input.tarifaId,
    operadorId: input.operadorId,
    horaEntrada: input.horaEntrada ?? new Date(),
    estado: 'activa',
    tipoEstadia: input.tipoEstadia ?? 'libre',
    cantidad: input.cantidad,
    cantidadHoras: input.cantidadHoras,
    cantidadDias: input.cantidadDias,
    tarifaBaseHora: input.tarifaBaseHora,
    tarifa: input.tarifa,
    prepago: Boolean(input.prepago),
    turnoId: input.turnoId,
    totalCobrado: Number(input.totalCobrado ?? 0),
    metodoPago: input.metodoPago,
    detalleCobro: input.detalleCobro,
  });
}

export async function closeTicket(input: TicketCloseInput) {
  const ticket = await Ticket.findOne({ ticketNumber: input.ticketNumber });
  if (!ticket) {
    throw new Error('Ticket no encontrado.');
  }

  ticket.horaSalida = input.horaSalida ?? new Date();
  ticket.estado = 'cerrada';
  ticket.totalCobrado = Number(input.totalCobrado ?? ticket.totalCobrado ?? 0);
  ticket.metodoPago = input.metodoPago ?? ticket.metodoPago;
  ticket.detalleCobro = input.detalleCobro ?? ticket.detalleCobro;
  ticket.tiempoTotal = input.tiempoTotal ?? ticket.tiempoTotal;
  ticket.tarifa = input.tarifa ?? ticket.tarifa;
  ticket.tarifaBaseHora = input.tarifaBaseHora ?? ticket.tarifaBaseHora;
  ticket.cantidadHoras = input.cantidadHoras ?? ticket.cantidadHoras;
  ticket.cantidadDias = input.cantidadDias ?? ticket.cantidadDias;
  if (typeof input.prepago === 'boolean') ticket.prepago = input.prepago;

  await ticket.save();
  return ticket;
}

export async function updateTicket(ticketNumber: string, cambios: TicketUpdateInput) {
  const ticket = await Ticket.findOne({ ticketNumber });
  if (!ticket) {
    throw new Error('Ticket no encontrado.');
  }

  if (typeof cambios.patente === 'string') ticket.patente = normalizePatente(cambios.patente);
  if (cambios.categoria) ticket.categoria = cambios.categoria;
  if (cambios.tipoEstadia) ticket.tipoEstadia = cambios.tipoEstadia;
  if (cambios.metodoPago) ticket.metodoPago = cambios.metodoPago;
  if (typeof cambios.totalCobrado === 'number') ticket.totalCobrado = cambios.totalCobrado;
  if (typeof cambios.detalleCobro === 'string') ticket.detalleCobro = cambios.detalleCobro;
  if (typeof cambios.tiempoTotal === 'string') ticket.tiempoTotal = cambios.tiempoTotal;
  if (cambios.horaSalida instanceof Date) ticket.horaSalida = cambios.horaSalida;
  if (cambios.estado) ticket.estado = cambios.estado;
  if (typeof cambios.tarifaId !== 'undefined') ticket.tarifaId = cambios.tarifaId;
  if (typeof cambios.prepago === 'boolean') ticket.prepago = cambios.prepago;
  if (typeof cambios.cantidad === 'number') ticket.cantidad = cambios.cantidad;
  if (typeof cambios.cantidadHoras === 'number') ticket.cantidadHoras = cambios.cantidadHoras;
  if (typeof cambios.cantidadDias === 'number') ticket.cantidadDias = cambios.cantidadDias;
  if (typeof cambios.billingDocumentId !== 'undefined') ticket.billingDocumentId = cambios.billingDocumentId;
  if (typeof cambios.billingDocumentCode === 'string') ticket.billingDocumentCode = cambios.billingDocumentCode;
  if (cambios.tarifa) ticket.tarifa = cambios.tarifa;

  await ticket.save();
  return ticket;
}
