'use client';

import { useCallback, useEffect, useState } from 'react';
import type { LiquidacionPayload, TurnoCaja } from '@/modules/caja/types/caja.types';
import {
  abrirTurno as abrirTurnoService,
  cerrarTurno as cerrarTurnoService,
  fetchTurnoActual,
  liquidarTurno as liquidarTurnoService,
} from '@/modules/caja/services/caja.service';

interface UseTurnoCajaResult {
  turno: TurnoCaja | null;
  loading: boolean;
  error: string | null;
  fetchTurno: () => Promise<void>;
  abrirTurno: () => Promise<TurnoCaja | null>;
  cerrarTurno: () => Promise<boolean>;
  liquidarTurno: (payload: LiquidacionPayload) => Promise<TurnoCaja | null>;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function useTurnoCaja(operatorId?: string): UseTurnoCajaResult {
  const [turno, setTurno] = useState<TurnoCaja | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTurno = useCallback(async () => {
    if (!operatorId) {
      setTurno(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchTurnoActual(operatorId);
      setTurno(result);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'No se pudo obtener el turno'));
      setTurno(null);
    } finally {
      setLoading(false);
    }
  }, [operatorId]);

  const abrirTurno = useCallback(async () => {
    if (!operatorId) {
      setError('Debe indicar el operador para abrir un turno.');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await abrirTurnoService(operatorId);
      setTurno(result);
      return result;
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'No se pudo abrir el turno'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [operatorId]);

  const cerrarTurno = useCallback(async () => {
    if (!operatorId || !turno) {
      setError('Debe abrir un turno antes de cerrarlo.');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      await cerrarTurnoService(operatorId);
      setTurno(null);
      return true;
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'No se pudo cerrar el turno'));
      return false;
    } finally {
      setLoading(false);
    }
  }, [operatorId, turno]);

  const liquidarTurno = useCallback(
    async (payload: LiquidacionPayload) => {
      if (!operatorId || !turno) {
        setError('Debe abrir un turno antes de liquidarlo.');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await liquidarTurnoService(operatorId, payload);
        setTurno(result);
        return result;
      } catch (err: unknown) {
        setError(getErrorMessage(err, 'No se pudo liquidar el turno'));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [operatorId, turno],
  );

  useEffect(() => {
    void fetchTurno();
  }, [fetchTurno]);

  return {
    turno,
    loading,
    error,
    fetchTurno,
    abrirTurno,
    cerrarTurno,
    liquidarTurno,
  };
}
