'use client';

import { useState } from 'react';
import type { SalidaData } from '@/app/hooks/Parking/Caja/useSalida';

export function useCerrarPrepago() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cerrarPrepago = async (ticketNumber: string, payload: SalidaData & { pagado?: boolean }) => {
    setLoading(true);
    setError(null);

    try {
      const updateData: Partial<SalidaData> & { pagado?: boolean } = {
        estado: 'cerrada',
        horaSalida: payload.horaSalida,
        totalCobrado: payload.totalCobrado,
        detalleCobro: payload.detalleCobro,
        metodoPago: payload.metodoPago,
        tarifaId: payload.tarifaId,
        cantidadHoras: payload.cantidadHoras,
        cantidadDias: payload.cantidadDias,
        prepago: true,
        pagado: payload.pagado === true,
        patente: payload.patente,
        categoria: payload.categoria,
        tipoEstadia: payload.tipoEstadia,
      };

      const resPut = await fetch('/api/estadias/habilitar/cerrar-prepago', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketNumber, updateData }),
      });

      if (!resPut.ok) {
        const errText = await resPut.text();
        throw new Error(`Error al cerrar prepago: ${errText}`);
      }

      const data = await resPut.json();
      const ticketActualizado: SalidaData = data.ticket;

      setLoading(false);
      return ticketActualizado;
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Error desconocido');
      return null;
    }
  };

  return { cerrarPrepago, loading, error };
}
