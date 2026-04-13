'use client';

import { useState, useCallback } from 'react';
import { IEstadia } from '@/interfaces/Estadias/estadias';
import { SubTarifa } from '@/interfaces/Tarifa/tarifa';

export function useEstadias() {
  const [estadias, setEstadias] = useState<IEstadia[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calcularMontoConTiempo = useCallback((estadia: IEstadia, tarifa: SubTarifa): number => {
    if (!estadia.horaEntrada) return 0;

    const entrada = new Date(estadia.horaEntrada);
    const ahora = new Date();
    const diffMin = (ahora.getTime() - entrada.getTime()) / 1000 / 60;
    const precioHora = tarifa.precioUnitario;

    if (diffMin <= 5) return 0;
    if (diffMin <= 60) return precioHora;
    if (diffMin <= 75) return precioHora * 2;

    const minutosExtra = diffMin - 75;
    const fracciones = Math.ceil(minutosExtra / 30);
    return precioHora * 2 + fracciones * (precioHora / 2);
  }, []);

  const createEstadia = useCallback(
    async (
      subTarifa: SubTarifa,
      patente: string,
      operadorId: string,
      parkinglotId: string,
      entrada?: string,
      salida?: string,
      extras?: {
        prepago?: boolean;
        totalCobrado?: number;
        metodoPago?: 'efectivo' | 'tarjeta' | 'qr';
      }
    ): Promise<IEstadia> => {
      setLoading(true);
      setError(null);

      try {
        const entradaArg = entrada ? new Date(entrada) : undefined;
        const salidaArg = salida ? new Date(salida) : undefined;

        const payloadBase = {
          ticket: `T-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          patente,
          operadorId,
          parkinglotId,
          categoria: subTarifa.category,
          tipoEstadia: subTarifa.tipoEstadia,
          tarifaId: subTarifa._id,
          horaEntrada: entradaArg,
          horaSalida: salidaArg,
          estado: 'activa',
          prepago: extras?.prepago ?? false,
          totalCobrado: extras?.totalCobrado ?? 0,
          metodoPago: extras?.metodoPago ?? 'efectivo',
        };

        let payload: any;
        switch (subTarifa.tipoEstadia) {
          case 'hora':
            payload = { ...payloadBase, cantidadHoras: subTarifa.cantidad, cantidadDias: 0, cantidadMeses: 0, precioUnitario: subTarifa.precioUnitario, bonificacionPorc: subTarifa.bonificacionPorc ?? 0, precioConDescuento: subTarifa.precioConDescuento ?? subTarifa.precioTotal, precioTotal: subTarifa.precioTotal };
            break;
          case 'dia':
            payload = { ...payloadBase, cantidadHoras: 0, cantidadDias: subTarifa.cantidad, cantidadMeses: 0, precioUnitario: subTarifa.precioUnitario, bonificacionPorc: subTarifa.bonificacionPorc ?? 0, precioConDescuento: subTarifa.precioConDescuento ?? subTarifa.precioTotal, precioTotal: subTarifa.precioTotal };
            break;
          case 'mensual':
            payload = { ...payloadBase, cantidadHoras: 0, cantidadDias: 0, cantidadMeses: subTarifa.cantidad, precioUnitario: subTarifa.precioUnitario, bonificacionPorc: subTarifa.bonificacionPorc ?? 0, precioConDescuento: subTarifa.precioConDescuento ?? subTarifa.precioTotal, precioTotal: subTarifa.precioTotal };
            break;
          case 'libre':
            payload = { ...payloadBase, cantidadHoras: 0, cantidadDias: 0, cantidadMeses: 0, precioUnitario: subTarifa.precioUnitario, bonificacionPorc: subTarifa.bonificacionPorc ?? 0, precioConDescuento: subTarifa.precioConDescuento ?? subTarifa.precioTotal, precioTotal: subTarifa.precioTotal };
            break;
          default:
            throw new Error('Tipo de tarifa desconocido');
        }

        const res = await fetch('/api/estadias', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error(`Error al crear estadía: ${res.statusText}`);

        const data: IEstadia = await res.json();
        setEstadias((prev) => [data, ...prev]);
        return data;
      } catch (err: any) {
        console.error('[useEstadias] Error createEstadia:', err);
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateEstadia = useCallback(async (data: Partial<IEstadia> & { _id: string }): Promise<IEstadia> => {
    try {
      setLoading(true);

      const res = await fetch('/api/estadias', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Error al actualizar estadía');
      const updated: IEstadia = await res.json();
      setEstadias((prev) => prev.map((e) => (e._id === updated._id ? updated : e)));
      return updated;
    } catch (err) {
      console.error('updateEstadia error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getEstadiaByTicket = useCallback(async (ticket: string): Promise<IEstadia | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/estadias?ticketNumber=${ticket}`);
      if (!res.ok) return null;

      const data: IEstadia[] = await res.json();
      return data.length > 0 ? data[0] : null;
    } catch (err: any) {
      console.error('[useEstadias] Error getEstadiaByTicket:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/estadias', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Error al refrescar estadías: ${res.statusText}`);
      }
      const data: IEstadia[] = await res.json();
      setEstadias(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('[useEstadias] Error refresh:', err);
      setError(err.message || 'Error refrescando estadías');
    } finally {
      setLoading(false);
    }
  }, []);

  const closeEstadia = useCallback(async (_id: string, totalCobrado?: number, metodoPago?: 'efectivo' | 'tarjeta' | 'qr' | 'otros'): Promise<IEstadia> => {
    try {
      setLoading(true);

      const payload = {
        _id,
        estado: 'cerrada',
        horaSalida: new Date(),
        totalCobrado: totalCobrado ?? 0,
        metodoPago: metodoPago ?? 'efectivo',
      };

      const res = await fetch('/api/estadias', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Error al cerrar estadía');

      const updated: IEstadia = await res.json();
      setEstadias((prev) => prev.map((e) => (e._id === updated._id ? updated : e)));
      return updated;
    } catch (err) {
      console.error('[useEstadias] Error closeEstadia:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    estadias,
    loading,
    error,
    refresh,
    createEstadia,
    updateEstadia,
    getEstadiaByTicket,
    calcularMontoConTiempo,
    closeEstadia,
  };
}
