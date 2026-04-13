import { useState, useEffect } from 'react';

export const useEstadias = () => {
  const [estadias, setEstadias] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEstadias = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/caja');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error obteniendo estadías');
      setEstadias(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstadias();
  }, []);

  return { estadias, loading, error, refresh: fetchEstadias };
};
