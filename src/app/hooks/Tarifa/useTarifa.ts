'use client';
import { useState, useEffect, useCallback } from 'react';
import { ITarifa, TarifaHora, TarifaDia, TarifaMensual, TarifaLibre,SubTarifa, Categoria } from '@/interfaces/Tarifa/tarifa';


export function useTarifas(parkinglotId?: string) {
  const [tarifas, setTarifas] = useState<ITarifa[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTarifaByCategory = useCallback(
  (categoria: Categoria) => {
    return tarifas.find(t => t.category === categoria) ?? null;
  },
  [tarifas]
);



  // -------------------- GET tarifas --------------------
  const fetchTarifas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/tarifas');
      if (!res.ok) throw new Error('Error al obtener tarifas');
      const data: ITarifa[] = await res.json();
      setTarifas(parkinglotId ? data.filter(t => t.parkinglotId === parkinglotId) : data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [parkinglotId]);

  // -------------------- CREATE / UPDATE unificado --------------------
  const createOrUpdateTarifa = useCallback(
    async (payload: Partial<ITarifa>) => {
      setError(null);
      try {
        const res = await fetch('/api/tarifas/unificado', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error('Error al crear/actualizar tarifa');
        const tarifaActualizada: ITarifa = await res.json();

        setTarifas(prev => {
          const index = prev.findIndex(
            t => t.parkinglotId === tarifaActualizada.parkinglotId && t.category === tarifaActualizada.category
          );
          if (index >= 0) {
            const copy = [...prev];
            copy[index] = tarifaActualizada;
            return copy;
          }
          return [...prev, tarifaActualizada];
        });

        return tarifaActualizada;
      } catch (err: any) {
        setError(err.message);
      }
    },
    []
  );

  // -------------------- DELETE tarifa --------------------
const deleteTarifa = useCallback(async (parentId: string) => {
  setError(null);
  try {
    const res = await fetch(`/api/tarifas/${parentId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error al eliminar tarifa');
    
    // Eliminamos el ITarifa completo de la UI
    setTarifas(prev => prev.filter(t => t._id !== parentId));
  } catch (err: any) {
    setError(err.message);
  }
}, []);



  // -------------------- EDITAR subdocumento --------------------
  const editSubTarifa = useCallback(
    async (
      parentId: string,
      subId: string,
      tipo: 'tarifasHora' | 'tarifasPorDia' | 'tarifaMensual' | 'tarifaLibre',
      data: Partial<TarifaHora & TarifaDia & TarifaMensual & TarifaLibre>
    ) => {
      setError(null);
      try {
        const res = await fetch(`/api/tarifas/${parentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subId, tipo, data }),
        });
        if (!res.ok) throw new Error('Error al editar tarifa');
        await fetchTarifas();
      } catch (err: any) {
        setError(err.message);
      }
    },
    [fetchTarifas]
  );

  // -------------------- BORRAR subdocumento --------------------
  const deleteSubTarifa = useCallback(
    async (
      parentId: string,
      subId: string,
      tipo: 'tarifasHora' | 'tarifasPorDia' | 'tarifaMensual' | 'tarifaLibre'
    ) => {
      setError(null);
      try {
        const res = await fetch(`/api/tarifas/${parentId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subId, tipo }),
        });
        if (!res.ok) throw new Error('Error al eliminar tarifa');
        await fetchTarifas();
      } catch (err: any) {
        setError(err.message);
      }
    },
    [fetchTarifas]
  );

  

  // -------------------- ADD helper que concatena --------------------
  const addOrUpdateTarifa = useCallback(
    async (
      parkinglotId: string,
      category: Categoria,
      tipo: 'hora' | 'dia' | 'mensual' | 'libre',
      nuevasTarifas: (TarifaHora | TarifaDia | TarifaMensual | TarifaLibre)[]
    ) => {
      const existing = tarifas.find(t => t.parkinglotId === parkinglotId && t.category === category);
      const payload: Partial<ITarifa> = { parkinglotId, category };

      switch (tipo) {
        case 'hora':
          payload.tarifasHora = [...(existing?.tarifasHora || []), ...nuevasTarifas as TarifaHora[]];
          break;
        case 'dia':
          payload.tarifasPorDia = [...(existing?.tarifasPorDia || []), ...nuevasTarifas as TarifaDia[]];
          break;
        case 'mensual':
          payload.tarifaMensual = [...(existing?.tarifaMensual || []), ...nuevasTarifas as TarifaMensual[]];
          break;
        case 'libre':
          payload.tarifaLibre = [...(existing?.tarifaLibre || []), ...nuevasTarifas as TarifaLibre[]];
          break;
      }

      return createOrUpdateTarifa(payload);
    },
    [tarifas, createOrUpdateTarifa]
  );

  

  useEffect(() => {
    fetchTarifas();
  }, [fetchTarifas]);

  return {
    tarifas,
    loading,
    error,
    fetchTarifas,
    createOrUpdateTarifa,
    addOrUpdateTarifa,
    deleteTarifa,
    editSubTarifa,
    deleteSubTarifa,
    getTarifaByCategory,
  };
}
