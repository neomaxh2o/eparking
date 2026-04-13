'use client';
import { useState, useEffect, useCallback } from 'react';

export interface Novedad {
  _id: string;
  title: string;
  description: string;
  author?: string;
  category?: string;
  date: string;
  parkingId?: string | null;
  recipients?: string[];
  recipientParkings?: string[];
  isGlobal?: boolean;
}

interface UseNovedadesReturn {
  novedades: Novedad[];
  loading: boolean;
  error: string | null;
  fetchNovedades: (parkingId?: string) => Promise<void>;
  crearNovedad: (data: Partial<Novedad>) => Promise<Novedad | null>;
}

/**
 * Hook para manejar novedades y mensajes.
 * @param currentUserName Nombre del operador activo, se usa como author
 */
export function useNovedades(currentUserName?: string): UseNovedadesReturn {
  const [novedades, setNovedades] = useState<Novedad[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener novedades
  const fetchNovedades = useCallback(async (parkingId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = parkingId
        ? `/api/parking/novedades?parkingId=${parkingId}`
        : '/api/parking/novedades';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Error al obtener novedades');
      const data: Novedad[] = await res.json();
      setNovedades(data);
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  // Crear novedad o mensaje
  const crearNovedad = useCallback(async (data: Partial<Novedad>) => {
    setLoading(true);
    setError(null);
    try {
      // ✅ asignar autor automáticamente si existe currentUserName
      const dataConAutor = { ...data, author: currentUserName ?? data.author };

      const res = await fetch('/api/parking/novedades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataConAutor),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al crear novedad');
      }

      const nueva: Novedad = await res.json();
      setNovedades(prev => [nueva, ...prev]); // agregar al inicio
      return nueva;
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUserName]);

  // Auto-fetch inicial
  useEffect(() => {
    fetchNovedades();
  }, [fetchNovedades]);

  return {
    novedades,
    loading,
    error,
    fetchNovedades,
    crearNovedad,
  };
}
