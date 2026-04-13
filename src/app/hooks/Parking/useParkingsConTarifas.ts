// src/app/hooks/Parking/useParkingsConTarifas.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Tarifa } from '@/interfaces/tarifa';
import type { Parking } from '@/interfaces/parking';

interface ParkingConTarifas extends Parking {
  tarifas: Tarifa[];
}

interface UseParkingsConTarifasResult {
  parkings: ParkingConTarifas[];
  loading: boolean;
  error: string | null;
  fetchParkingsConTarifas: () => Promise<void>;
  createTarifa: (tarifa: Tarifa) => Promise<boolean>;
  updateTarifa: (id: string, tarifa: Partial<Tarifa>) => Promise<boolean>;
  deleteTarifa: (id: string) => Promise<boolean>;
  getTarifaByCategory: (category: Tarifa['category']) => Promise<Tarifa | undefined>;
}

export function useParkingsConTarifas(): UseParkingsConTarifasResult {
  const [parkings, setParkings] = useState<ParkingConTarifas[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchParkingsConTarifas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/parking?includeTarifas=true');
      if (!res.ok) throw new Error('Error al obtener playas con tarifas');

      const data: ParkingConTarifas[] = await res.json();
      setParkings(data);
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  // Aplanar todas las tarifas de todas las playas para poder operar igual que antes
  const tarifas: Tarifa[] = parkings.flatMap(p => p.tarifas || []);

  const createTarifa = useCallback(async (tarifa: Tarifa) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/parking/tarifas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tarifa), // incluye parkinglotId dentro de tarifa
      });
      if (!res.ok) throw new Error('Error al crear tarifa');
      const newTarifa: Tarifa = await res.json();

      // Actualizo estado local agregando tarifa a la playa correcta
      setParkings((prev) =>
        prev.map((p) =>
          p._id === newTarifa.parkinglotId
            ? { ...p, tarifas: [...(p.tarifas || []), newTarifa] }
            : p
        )
      );
      return true;
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTarifa = useCallback(
    async (id: string, tarifa: Partial<Tarifa>) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/parking/tarifas?id=${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tarifa),
        });
        if (!res.ok) throw new Error('Error al actualizar tarifa');
        const updated: Tarifa = await res.json();

        setParkings((prev) =>
          prev.map((p) => ({
            ...p,
            tarifas: p.tarifas?.map((t) => (t._id === id ? updated : t)) || [],
          }))
        );

        return true;
      } catch (err: any) {
        setError(err.message || 'Error desconocido');
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteTarifa = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/parking/tarifas?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Error al eliminar tarifa');

      setParkings((prev) =>
        prev.map((p) => ({
          ...p,
          tarifas: p.tarifas?.filter((t) => t._id !== id) || [],
        }))
      );

      return true;
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTarifaByCategory = useCallback(
    async (category: Tarifa['category']): Promise<Tarifa | undefined> => {
      // Buscar en todas las tarifas de todas las playas
      for (const p of parkings) {
        const tarifa = p.tarifas?.find((t) => t.category === category);
        if (tarifa) return tarifa;
      }
      return undefined;
    },
    [parkings]
  );

  useEffect(() => {
    fetchParkingsConTarifas();
  }, [fetchParkingsConTarifas]);

  return {
    parkings,
    loading,
    error,
    fetchParkingsConTarifas,
    createTarifa,
    updateTarifa,
    deleteTarifa,
    getTarifaByCategory,
  };
}
