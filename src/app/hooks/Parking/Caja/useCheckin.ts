'use client';

/**
 * @deprecated Use `@/modules/caja/services/caja.service` or module-level hooks directly.
 * Legacy compatibility layer. Do not use in new code.
 */
import { useState } from 'react';
import { registrarIngreso } from '@/modules/caja/services/caja.service';

export interface CheckinData {
  ticketNumber?: string;
  patente: string;
  categoria: 'Otros' | 'Automóvil' | 'Camioneta' | 'Motocicleta';
  tipoEstadia: 'hora' | 'dia' | 'libre';
  tarifaId: string;
  operadorId: string;
  playaId?: string;
}

export interface EstadiaResponse {
  _id?: string;
  ticketNumber: string;
  patente: string;
  categoria: 'Otros' | 'Automóvil' | 'Camioneta' | 'Motocicleta';
  tipoEstadia: 'hora' | 'dia' | 'libre';
  horaEntrada: string;
  operadorId: string;
  tarifaId?: string;
  playaId?: string;
  estado: 'activa' | 'cerrada';
}

export function useCheckin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCheckin = async (payload: CheckinData): Promise<EstadiaResponse> => {
    setLoading(true);
    setError(null);

    try {
      const ticket = await registrarIngreso({
        operatorId: payload.operadorId,
        patente: payload.patente,
        categoria: payload.categoria,
        tarifaId: payload.tarifaId,
        tipoEstadia: payload.tipoEstadia,
        cantidad: payload.tipoEstadia === 'libre' ? 0 : 1,
        prepago: false,
      });

      return {
        _id: ticket._id,
        ticketNumber: ticket.ticketNumber,
        patente: ticket.patente,
        categoria: ticket.categoria,
        tipoEstadia: ticket.tipoEstadia,
        horaEntrada: ticket.horaEntrada,
        operadorId: payload.operadorId,
        tarifaId: ticket.tarifaId,
        playaId: payload.playaId,
        estado: ticket.estado,
      };
    } catch (err: any) {
      setError(err.message || 'Error inesperado');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createCheckin, loading, error };
}
