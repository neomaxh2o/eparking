import { useState, useEffect, useCallback } from 'react';

export interface Mensaje {
  _id: string;
  title: string;
  description: string;
  author?: string;
  category?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  parkingId?: string;
  recipients?: string[];
  isGlobal?: boolean;
}

interface UseMensajesParams {
  userId?: string;
  assignedParkingId?: string;
}

type RawRecipient = string | { _id: string };
type RawParkingId = string | { _id: string };

interface RawMensaje {
  _id: string;
  title: string;
  description: string;
  author?: string;
  category?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  parkingId?: RawParkingId;
  recipients?: RawRecipient[];
  isGlobal?: boolean;
}

export function useMensajes({ userId, assignedParkingId }: UseMensajesParams = {}) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizeMensaje = (m: Partial<RawMensaje>): Mensaje => {
    const { _id, title, description, date, createdAt, updatedAt, author, category, parkingId, recipients, isGlobal } = m;

    if (!_id || !title || !description || !date || !createdAt || !updatedAt) {
      throw new Error('Mensaje incompleto');
    }

    // Normalizamos parkingId
    let parkingIdStr: string | undefined;
    if (!parkingId) {
      parkingIdStr = undefined;
    } else if (typeof parkingId === 'string') {
      parkingIdStr = parkingId;
    } else if ('_id' in parkingId && typeof parkingId._id === 'string') {
      parkingIdStr = parkingId._id;
    } else {
      parkingIdStr = undefined;
    }

    // Normalizamos recipients
    const recipientsStr: string[] = (recipients ?? [])
      .map((r) => (typeof r === 'string' ? r : ('_id' in r && typeof r._id === 'string' ? r._id : undefined)))
      .filter((r): r is string => Boolean(r));

    return {
      _id,
      title,
      description,
      author,
      category,
      date,
      createdAt,
      updatedAt,
      parkingId: parkingIdStr,
      recipients: recipientsStr,
      isGlobal,
    };
  };

  const fetchMensajes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = '/api/parking/novedades?category=Mensajes';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Error al cargar mensajes');

      const data: RawMensaje[] = await res.json();
      const normalizados: Mensaje[] = data.map(normalizeMensaje);
      setMensajes(normalizados);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      setMensajes([]);
      console.error('[useMensajes] fetchMensajes ERROR ->', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const crearMensaje = useCallback(async (mensaje: Partial<RawMensaje>): Promise<void> => {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/parking/novedades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...mensaje, category: 'Mensajes' }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al crear mensaje');
      }

      const nuevaRaw: RawMensaje = await res.json();
      const nueva = normalizeMensaje(nuevaRaw);

      setMensajes((prev) => [nueva, ...prev.filter((m) => m._id !== nueva._id)]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useMensajes] crearMensaje ERROR ->', err);
      throw err;
    } finally {
      setCreating(false);
    }
  }, []);

  const filtrarMensajes = useCallback(
    (searchTerm: string): Mensaje[] => {
      return mensajes
        .filter((m) => {
          if (m.isGlobal) return true;
          const esDestinatario = m.recipients?.includes(userId ?? '') ?? false;
          const coincideParking = assignedParkingId && m.parkingId === assignedParkingId;
          if (!(esDestinatario || coincideParking)) return false;

          return (
            m.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (m.category?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
          );
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    [mensajes, userId, assignedParkingId]
  );

  useEffect(() => {
    fetchMensajes();
  }, [fetchMensajes]);

  return {
    mensajes,
    loading,
    creating,
    error,
    fetchMensajes,
    crearMensaje,
    filtrarMensajes,
  };
}
