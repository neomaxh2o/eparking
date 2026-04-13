'use client';

import { useUsers } from '@/app/hooks/Users/useUsers';
import { useParkingLots } from '@/modules/parking/hooks/useParkingLots';
import { useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { UserPlus, LayoutDashboard, List } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'operator' | 'owner' | 'admin';
  assignedParking?: string | { _id: string; name: string };
  createdAt?: string;
}

interface ParkingLot {
  _id: string;
  owner: User | string;
  name: string;
}

interface OperatorCardProps {
  user: User;
  parkingName?: string;
  isActive: boolean;
}

const roleIcon = (role: string) => {
  switch (role) {
    case 'operator':
      return <UserPlus className="h-5 w-5 text-gray-700" />;
    case 'owner':
      return <LayoutDashboard className="h-5 w-5 text-gray-700" />;
    case 'admin':
      return <List className="h-5 w-5 text-gray-700" />;
    default:
      return null;
  }
};

const OperatorCard = ({ user, parkingName, isActive }: OperatorCardProps) => (
  <li className="dashboard-section p-5 transition hover:shadow-md">
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-3">
        <div className="mt-1 flex-shrink-0">{roleIcon(user.role)}</div>
        <div className="space-y-1">
          <p className="text-lg font-semibold text-gray-900">{user.name}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
          {parkingName ? (
            <span className="inline-flex rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
              {parkingName}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col items-start gap-3 md:items-end">
        <div className="flex items-center gap-2" title={isActive ? 'Activo' : 'Offline'}>
          <span className={`h-2.5 w-2.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
          <span className="text-sm font-medium text-gray-700">{isActive ? 'Activo' : 'Offline'}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            Editar
          </button>
          <button className="rounded-xl bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-black">
            Detalles
          </button>
        </div>
      </div>
    </div>
  </li>
);

const SkeletonCard = () => (
  <div className="dashboard-section animate-pulse p-4 space-y-2">
    <div className="h-4 w-1/2 rounded bg-gray-200"></div>
    <div className="h-4 w-3/4 rounded bg-gray-200"></div>
    <div className="h-4 w-1/4 rounded bg-gray-200"></div>
  </div>
);

export default function UserList({ currentUserId }: { currentUserId: string }) {
  const { users, loading: usersLoading, error: usersError } = useUsers();
  const { parkings, loading: parkingsLoading, error: parkingsError } = useParkingLots();
  const { data: session, status } = useSession();

  const safeUsers = users ?? [];
  const safeParkings = parkings ?? [];

  const ownerParkingIds = useMemo(
    () =>
      safeParkings
        .filter((p) => (typeof p.owner === 'string' ? p.owner === currentUserId : p.owner._id === currentUserId))
        .map((p) => p._id.toString()),
    [safeParkings, currentUserId],
  );

  const operadoresAsignados = useMemo(
    () =>
      safeUsers.filter(
        (u) =>
          u.role === 'operator' &&
          u.assignedParking &&
          ownerParkingIds.includes(typeof u.assignedParking === 'string' ? u.assignedParking : u.assignedParking._id),
      ),
    [safeUsers, ownerParkingIds],
  );

  const isLoading = usersLoading || parkingsLoading;
  const hasError = usersError || parkingsError;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, idx) => (
          <SkeletonCard key={idx} />
        ))}
      </div>
    );
  }

  if (hasError) {
    return <p className="text-center text-sm text-red-500">{usersError || parkingsError}</p>;
  }

  if (operadoresAsignados.length === 0) {
    return <p className="text-center text-sm text-gray-600">No hay operadores asignados a tus playas.</p>;
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {operadoresAsignados.map((user) => {
          const assignedParkingId = typeof user.assignedParking === 'string' ? user.assignedParking : user.assignedParking._id;
          const playaAsignada = safeParkings.find((p) => p._id.toString() === assignedParkingId);
          const isActive = session?.user?.email === user.email && status === 'authenticated';

          return (
            <OperatorCard
              key={user._id}
              user={user}
              parkingName={playaAsignada?.name}
              isActive={isActive}
            />
          );
        })}
      </ul>
    </div>
  );
}
