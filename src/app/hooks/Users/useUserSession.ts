'use client';

import { useSession } from 'next-auth/react';
import { User, ParkingRef } from '@/interfaces/user';

export function useUserSession() {
  const { data: session, status } = useSession();

  const currentUser: User | null = session?.user
    ? {
        _id: session.user.id,
        name: session.user.name || '',
        email: session.user.email || '',
        role: session.user.role as User['role'] || 'operator',
        // 🔹 Solo ID disponible desde NextAuth
        assignedParkingId: session.user.assignedParkingId || null,
        // Si querés incluir el objeto completo, tendrías que fetchearlo desde tu API:
        // assignedParking: fetchedParkingObject
      }
    : null;

  return { currentUser, status };
}
