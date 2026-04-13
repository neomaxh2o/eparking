'use client';

import { useState, useEffect } from 'react';
import { User as IUser } from '@/interfaces/user';

export function useCurrentUser() {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch('/api/users/me'); // endpoint para usuario logueado
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Error al cargar el usuario logueado');

        setUser(data.user);
      } catch (err: any) {
        setError(err.message || 'Error inesperado');
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  return { user, loading, error };
}
