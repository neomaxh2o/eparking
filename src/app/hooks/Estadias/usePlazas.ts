'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plaza, SubPlaza, Segmentacion } from '@/interfaces/Plaza/Plaza';

export function usePlazas() {
  const [plazas, setPlazas] = useState<Plaza[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------------------- FETCH ----------------------
  const fetchPlazas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/plazas');
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al cargar plazas');
      }
      const data: Plaza[] = await res.json();

      // Mapear para asegurar que cada plaza tenga parkingId opcional
      const mappedPlazas = data.map(p => ({
        ...p,
        parkingId: p.parkinglotId ?? null, // <-- agrega parkingId si no existe
      }));

      setPlazas(mappedPlazas);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------------------- PLAZA CRUD ----------------------
  const createPlaza = useCallback(async (plaza: Partial<Plaza>) => {
    const categoria = plaza.segmentaciones?.[0]?.categoria;

    const payload = {
      ...plaza,
      categoria: undefined,
      segmentaciones: plaza.segmentaciones?.map(seg => ({
        ...seg,
        categoria: seg.categoria || categoria,
      })),
    };

    const res = await fetch('/api/plazas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error creando plaza');
    }
    const data: Plaza = await res.json();

    setPlazas(prev => [...prev, { ...data, parkingId: data.parkinglotId ?? null }]);
    return data;
  }, []);

  const updatePlaza = useCallback(async (id: string, updates: Partial<Plaza>) => {
    const res = await fetch(`/api/plazas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error actualizando plaza');
    }
    const data: Plaza = await res.json();
    setPlazas(prev => prev.map(p => (p._id === id ? { ...data, parkingId: data.parkinglotId ?? null } : p)));
    return data;
  }, []);

  const deletePlaza = useCallback(async (id: string) => {
    const res = await fetch(`/api/plazas/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error eliminando plaza');
    }
    await res.json();
    setPlazas(prev => prev.filter(p => p._id !== id));
  }, []);

  // ---------------------- SUBPLAZA CRUD ----------------------
  const saveSubPlaza = useCallback(async (plazaId: string, sub: Partial<SubPlaza>) => {
    let res: Response;
    if (sub.numero === undefined) {
      res = await fetch(`/api/plazas/${plazaId}/subplaza`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      });
    } else {
      res = await fetch(`/api/plazas/${plazaId}?sub=${sub.numero}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      });
    }

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error guardando subplaza');
    }

    const data: SubPlaza = await res.json();

    setPlazas(prev =>
      prev.map(p => {
        if (p._id !== plazaId) return p;
        const exists = p.plazasFisicas.some(sp => sp.numero === data.numero);
        return {
          ...p,
          plazasFisicas: exists
            ? p.plazasFisicas.map(sp => (sp.numero === data.numero ? data : sp))
            : [...p.plazasFisicas, data],
        };
      })
    );

    return data;
  }, []);

  const deleteSubPlaza = useCallback(async (plazaId: string, numero: number) => {
    const res = await fetch(`/api/plazas/${plazaId}?sub=${numero}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error eliminando subplaza');
    }
    await res.json();

    setPlazas(prev =>
      prev.map(p =>
        p._id === plazaId
          ? { ...p, plazasFisicas: p.plazasFisicas.filter(sp => sp.numero !== numero) }
          : p
      )
    );
  }, []);

  // ---------------------- SEGMENTACIÓN ----------------------
  const addSegmentacion = useCallback(async (plazaId: string, segment: Segmentacion) => {
    const res = await fetch(`/api/plazas/${plazaId}/segmentacion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(segment),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error agregando segmentación');
    }
    const updated: Plaza = await res.json();
    setPlazas(prev => prev.map(p => (p._id === plazaId ? { ...updated, parkingId: updated.parkinglotId ?? null } : p)));
    return updated;
  }, []);

  // ---------------------- EFFECT ----------------------
  useEffect(() => {
    fetchPlazas();
  }, [fetchPlazas]);

  return {
    plazas,
    loading,
    error,
    fetchPlazas,
    createPlaza,
    updatePlaza,
    deletePlaza,
    saveSubPlaza,
    deleteSubPlaza,
    addSegmentacion,
  };
}
