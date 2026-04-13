'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { getFechaActual } from '@/app/helpers/fechaHelpers';
import type { IngresoPayload, TicketCaja } from '../types/caja.types';
import { registrarIngreso as registrarIngresoService } from '../services/caja.service';

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function useIngresoCaja() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TicketCaja | null>(null);
  const { data: session } = useSession();

  const registrarIngreso = async (ingreso: IngresoPayload): Promise<TicketCaja | null> => {
    if (!session?.user?.id) {
      setError('No se encontró el operador logueado');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const tipoEstadia = ingreso.tipoEstadia ?? 'libre';

      const payload = {
        ...ingreso,
        operatorId: session.user.id,
        tipoEstadia,
        horaEntrada: getFechaActual(),
        prepago: ingreso.prepago ?? false,
        cantidad: ingreso.tarifaSeleccionada
          ? ingreso.tarifaSeleccionada.cantidad
          : typeof ingreso.cantidad === 'number'
            ? ingreso.cantidad
            : tipoEstadia === 'dia'
              ? 1
              : tipoEstadia === 'hora'
                ? 1
                : 0,
      };

      const result = await registrarIngresoService(payload);
      setData(result);
      return result;
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Error registrando ingreso'));
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { registrarIngreso, loading, error, data };
}
