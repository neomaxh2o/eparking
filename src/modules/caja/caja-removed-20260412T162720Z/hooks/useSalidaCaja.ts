'use client';

import { useState } from 'react';
import { getFechaActual } from '@/app/helpers/fechaHelpers';
import type { SalidaPayload, TicketCaja } from '../types/caja.types';
import {
  modificarSalida,
  obtenerSalida,
  registrarSalida as registrarSalidaService,
} from '../services/caja.service';

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function useSalidaCaja() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TicketCaja | null>(null);

  const obtenerTicket = async (ticketNumber: string): Promise<TicketCaja | null> => {
    if (!ticketNumber) return null;

    setLoading(true);
    setError(null);

    try {
      const result = await obtenerSalida(ticketNumber);
      setData(result);
      return result;
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Error obteniendo ticket'));
      return null;
    } finally {
      setLoading(false);
    }
  };

  const registrarSalida = async (ticket: SalidaPayload): Promise<TicketCaja | null> => {
    if (!ticket.ticketNumber) {
      setError('Ticket inválido');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await registrarSalidaService({
        ...ticket,
        horaSalida: getFechaActual(),
      });

      setData(result);
      return result;
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Error registrando salida'));
      return null;
    } finally {
      setLoading(false);
    }
  };

  const modificarTicket = async (
    ticketNumber: string,
    cambios: Partial<SalidaPayload>,
  ): Promise<TicketCaja | null> => {
    if (!ticketNumber) return null;

    setLoading(true);
    setError(null);

    try {
      const result = await modificarSalida(ticketNumber, cambios);
      setData(result);
      return result;
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Error modificando ticket'));
      return null;
    } finally {
      setLoading(false);
    }
  };

  const cerrarPrepago = async (ticket: TicketCaja): Promise<TicketCaja | null> => {
    if (!ticket.prepago) {
      setError('El ticket no es prepago');
      return null;
    }

    if (!ticket.ticketNumber) {
      setError('Ticket inválido');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await registrarSalidaService({
        ...ticket,
        horaSalida: getFechaActual(),
        totalCobrado: ticket.totalCobrado,
        metodoPago: ticket.metodoPago ?? 'efectivo',
        detalleCobro: ticket.detalleCobro,
        prepago: true,
      });

      setData(result);
      return result;
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Error cerrando prepago'));
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    registrarSalida,
    obtenerTicket,
    modificarTicket,
    cerrarPrepago,
    loading,
    error,
    data,
  };
}
