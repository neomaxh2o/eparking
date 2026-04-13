'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  fetchTurnoAdminActual,
  abrirTurnoAdmin,
  cerrarTurnoAdmin,
  liquidarTurnoAdmin,
  registrarCobroAdmin,
} from '@/modules/admin-caja/services/admin-cash.service';

export function useTurnoAdmin(parkinglotId?: string) {
  const [turno, setTurno] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTurno = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchTurnoAdminActual(parkinglotId);
      setTurno(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo obtener el turno admin');
      setTurno(null);
    } finally {
      setLoading(false);
    }
  }, [parkinglotId]);

  const abrir = useCallback(async (opts?: { operatorName?: string }) => {
    if (!parkinglotId) {
      setError('Debe indicar la playa para abrir turno administrativo.');
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await abrirTurnoAdmin({ parkinglotId, esCajaAdministrativa: true, operatorName: opts?.operatorName });
      setTurno(result);
      return result;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo abrir turno admin');
      return null;
    } finally {
      setLoading(false);
    }
  }, [parkinglotId]);

  const cerrar = useCallback(async () => {
    if (!turno || !turno._id) {
      setError('No hay turno abierto para cerrar.');
      return false;
    }
    setLoading(true);
    setError(null);
    try {
      await cerrarTurnoAdmin(turno._id);
      setTurno(null);
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo cerrar turno admin');
      return false;
    } finally {
      setLoading(false);
    }
  }, [turno]);

  const liquidar = useCallback(async (payload?: { totalDeclarado?: number; observado?: string }) => {
    if (!turno || !turno._id) {
      setError('No hay turno abierto para liquidar.');
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await liquidarTurnoAdmin(turno._id, payload ?? {});
      setTurno(result);
      return result;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo liquidar turno admin');
      return null;
    } finally {
      setLoading(false);
    }
  }, [turno]);

  const registrarCobro = useCallback(async (payload: { monto: number; paymentMethod?: string; descripcion?: string }) => {
    if (!turno || !turno._id) {
      setError('No hay turno abierto para registrar cobro.');
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await registrarCobroAdmin({ turnoId: turno._id, ...payload });
      // refetch turno to update totals
      await fetchTurno();
      return result;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar cobro admin');
      return null;
    } finally {
      setLoading(false);
    }
  }, [turno, fetchTurno]);

  useEffect(() => {
    void fetchTurno();
  }, [fetchTurno]);

  return {
    turno,
    loading,
    error,
    fetchTurno,
    abrir,
    cerrar,
    liquidar,
    registrarCobro,
  };
}
