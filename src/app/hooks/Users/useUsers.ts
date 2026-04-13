'use client';

import { useState, useEffect } from 'react';
import { User as IUser } from '@/interfaces/user'; // Importamos la interface global

export interface AssignedParking {
  _id: string;
  name: string;
}

export function useUsers() {
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users/list');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al cargar usuarios');

        // Mapear para agregar assignedParkingId
        const mappedUsers: IUser[] = (data.users || []).map((u: any) => ({
          ...u,
          assignedParkingId: u.assignedParking?._id ?? null,
        }));

        setUsers(mappedUsers);
      } catch (err: any) {
        setError(err.message || 'Error inesperado');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return { users, loading, error };
}
