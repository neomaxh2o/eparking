'use client';

import { useEffect, useRef, useState } from 'react';
import { obtenerEventosTurno } from '@/modules/turnos/services/turno-eventos.service';

export type TurnoEventoRow = {
  hora?: string;
  evento: string;
  ticket: string;
  patente: string;
  tipo: string;
  estado: string;
  prepago: boolean;
  vence?: string | null;
  total: number;
};

function sameItems(a: TurnoEventoRow[], b: TurnoEventoRow[]) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function useTurnoEventos(operatorId?: string) {
  const [items, setItems] = useState<TurnoEventoRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstLoadRef = useRef(true);
  const itemsRef = useRef<TurnoEventoRow[]>([]);

  const fetchEventos = async () => {
    if (!operatorId) return;
    if (document.visibilityState === 'hidden') return;

    if (firstLoadRef.current) setLoading(true);
    setError(null);

    try {
      const nextItems = await obtenerEventosTurno(operatorId);
      if (!sameItems(itemsRef.current, nextItems)) {
        itemsRef.current = nextItems;
        setItems(nextItems);
      }

      firstLoadRef.current = false;
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!operatorId) return;
    fetchEventos();
  }, [operatorId]);

  return { items, loading, error, refresh: fetchEventos };
}
