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
  const [loadingFetch, setLoadingFetch] = useState(false);
  const [loadingOpen, setLoadingOpen] = useState(false);
  const [loadingClose, setLoadingClose] = useState(false);
  const [loadingLiquidar, setLoadingLiquidar] = useState(false);
  const [loadingCobro, setLoadingCobro] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTurno = useCallback(async () => {
    setLoadingFetch(true);
    setError(null);
    try {
      const result = await fetchTurnoAdminActual(parkinglotId);
      setTurno(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo obtener el turno admin');
      setTurno(null);
    } finally {
      setLoadingFetch(false);
    }
  }, [parkinglotId]);

  const abrir = useCallback(async (opts?: { operatorName?: string }) => {
    if (!parkinglotId) {
      setError('Debe indicar la playa para abrir turno administrativo.');
      return null;
    }
    setLoadingOpen(true);
    setError(null);
    try {
      const result = await abrirTurnoAdmin({ parkinglotId, esCajaAdministrativa: true, operatorName: opts?.operatorName });
      setTurno(result);
      return result;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo abrir turno admin');
      return null;
    } finally {
      setLoadingOpen(false);
    }
  }, [parkinglotId]);

  const cerrar = useCallback(async () => {
    if (!turno || !turno._id) {
      setError('No hay turno abierto para cerrar.');
      return false;
    }
    setLoadingClose(true);
    setError(null);
    try {
      await cerrarTurnoAdmin(turno._id);
      setTurno(null);
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo cerrar turno admin');
      return false;
    } finally {
      setLoadingClose(false);
    }
  }, [turno]);

  const liquidar = useCallback(async (payload?: { totalDeclarado?: number; observado?: string }) => {
    if (!turno || !turno._id) {
      setError('No hay turno abierto para liquidar.');
      return null;
    }
    setLoadingLiquidar(true);
    setError(null);
    try {
      const result = await liquidarTurnoAdmin(turno._id, payload ?? {});
      setTurno(result);
      return result;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo liquidar turno admin');
      return null;
    } finally {
      setLoadingLiquidar(false);
    }
  }, [turno]);

  const registrarCobro = useCallback(async (payload: { monto: number; paymentMethod?: string; descripcion?: string }) => {
    if (!turno || !turno._id) {
      setError('No hay turno abierto para registrar cobro.');
      return null;
    }
    setLoadingCobro(true);
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
      setLoadingCobro(false);
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
