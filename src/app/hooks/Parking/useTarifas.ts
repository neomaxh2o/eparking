// en useTarifas.ts
import { useState, useCallback } from 'react';
import { Tarifa } from '@/interfaces/tarifa';
import { toClientArray, toClientObject } from '@/utils/toClientObject';

export function useTarifas() {
  const [tarifas, setTarifas] = useState<Tarifa[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTarifas = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/parking/tarifas');
      const data = await res.json();

      if (!data.success) throw new Error(data.error || 'Error al obtener tarifas');

      setTarifas(toClientArray(data.data)); // <-- aquí normalizamos
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTarifa = async (payload: Partial<Tarifa>) => {
    try {
      const res = await fetch('/api/parking/tarifas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Error creando tarifa');

      return toClientObject(data.data);
    } catch (err) {
      throw err;
    }
  };

  const updateTarifa = async (_id: string, payload: Partial<Tarifa>) => {
    try {
      const subId = (payload as any)?._id;
      const tipo = Array.isArray((payload as any)?.tarifasHora) && (payload as any).tarifasHora.length ? 'tarifasHora'
        : Array.isArray((payload as any)?.tarifasPorDia) && (payload as any).tarifasPorDia.length ? 'tarifasPorDia'
        : Array.isArray((payload as any)?.tarifaMensual) && (payload as any).tarifaMensual.length ? 'tarifaMensual'
        : 'tarifaLibre';
      const first = (payload as any)?.[tipo]?.[0] ?? {};
      const res = await fetch(`/api/tarifas/${_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subId, tipo, data: first }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Error actualizando tarifa');

      return toClientObject(data.data);
    } catch (err) {
      throw err;
    }
  };

  const deleteTarifa = async (_id: string, subId?: string, tipo?: string) => {
    try {
      const res = await fetch(`/api/tarifas/${_id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subId, tipo }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Error eliminando tarifa');

      return true;
    } catch (err) {
      throw err;
    }
  };

  return { tarifas, fetchTarifas, createTarifa, updateTarifa, deleteTarifa, loading, error };
}
