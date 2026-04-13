'use client';
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useUsers } from '@/app/hooks/Users/useUsers';
import { User } from '@/interfaces/user';

interface AssignedParking {
  _id: string;
  name: string;
}

export interface OperatorUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  assignedParking: AssignedParking;
  assignedParkingId: string;
}

interface TurnoContextProps {
  operator: OperatorUser | null;
  parkinglotId?: string; // ahora undefined en vez de null
  loading: boolean;
}

const TurnoContext = createContext<TurnoContextProps>({
  operator: null,
  parkinglotId: undefined,
  loading: true,
});

export const TurnoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { data: session, status } = useSession();
  const { users, loading: loadingUsers } = useUsers();
  const [operator, setOperator] = useState<OperatorUser | null>(null);
  const loading = status === 'loading' || loadingUsers || !operator;

  useEffect(() => {
    if (!session?.user?.email || loadingUsers) return;

    const found = users.find(u => u.email === session.user.email && u.role === 'operator');
    if (found) {
      const assignedParkingObj: AssignedParking =
        typeof found.assignedParking === 'string'
          ? { _id: found.assignedParking, name: found.assignedParking }
          : found.assignedParking ?? { _id: '', name: '' };

      const op: OperatorUser = {
        _id: found._id ?? '',
        name: found.name ?? '',
        email: found.email ?? '',
        role: found.role ?? 'operator',
        assignedParking: assignedParkingObj,
        assignedParkingId: found.assignedParkingId ?? assignedParkingObj._id,
      };

      setOperator(op);
    }
  }, [users, session, loadingUsers]);

  // parkinglotId se obtiene del operador o undefined si no hay operador
  const parkinglotId = operator?.assignedParkingId;

  return (
    <TurnoContext.Provider value={{ operator, parkinglotId, loading }}>
      {children}
    </TurnoContext.Provider>
  );
};

// Hook para usar el context fácilmente
export const useTurno = () => useContext(TurnoContext);
