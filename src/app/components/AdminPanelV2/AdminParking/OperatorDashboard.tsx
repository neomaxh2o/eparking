'use client';
import React, { useMemo } from 'react';
import { Tab } from '@headlessui/react';
import { FaNewspaper, FaCashRegister, FaParking } from 'react-icons/fa';
import { useUsers } from '@/app/hooks/Users/useUsers';
import NovedadesPanel from '@/app/components/AdminPanel/AdminParking/Novedades/NovedadesPanel';
import CajaDashboard from '@/app/components/Parking/Caja/CajaDashboard';
import EstadiaDashboard from '@/app/components/Parking/Estadias/EstadiasDashboard';
import { EstadiasProvider } from '@/app/context/EstadiasContext';

interface Parking { _id: string; name: string; }
interface User { _id: string; name: string; email: string; role: 'client' | 'operator' | 'owner' | 'admin' | 'guest'; assignedParking?: Parking | string; }
interface OperatorDashboardProps { currentUserId: string; }

function classNames(...classes: string[]) { return classes.filter(Boolean).join(' '); }
function isParkingObject(parking: Parking | string | undefined): parking is Parking {
  return typeof parking === 'object' && parking !== null && '_id' in parking && 'name' in parking;
}

export default function OperatorDashboard({ currentUserId }: OperatorDashboardProps) {
  const { users, loading: usersLoading, error: usersError } = useUsers();

  const currentUser = useMemo<User | null>(() => {
    if (!users) return null;
    const u = users.find((u) => u._id === currentUserId) ?? null;
    if (!u) return null;
    return {
      _id: u._id,
      name: u.name ?? 'Sin nombre',
      email: u.email ?? 'sinemail@ejemplo.com',
      role: u.role ?? 'guest',
      assignedParking:
        typeof u.assignedParking === 'object' && u.assignedParking !== null
          ? u.assignedParking
          : undefined,
    };
  }, [users, currentUserId]);

  if (usersLoading) return <p className="text-center mt-8 text-sm text-gray-500">Cargando datos...</p>;
  if (usersError) return <p className="text-center mt-8 text-sm text-red-500">Error: {usersError}</p>;
  if (!currentUser) return <p className="text-center mt-8 text-sm text-gray-600">Operador no encontrado o no autenticado.</p>;

  const assignedParking = isParkingObject(currentUser.assignedParking) ? currentUser.assignedParking : undefined;

  const tabs: { label: string; icon: React.ReactNode; component: React.ReactNode }[] = [
    {
      label: 'Caja',
      icon: <FaCashRegister />,
      component: <CajaDashboard nombreEstacionamiento={assignedParking?.name ?? 'Sin asignar'} />,
    },
    {
      label: 'Estadías',
      icon: <FaParking />,
      component: (
        <EstadiasProvider>
          <EstadiaDashboard />
        </EstadiasProvider>
      ),
    },
  ];

  if (['client', 'owner', 'operator'].includes(currentUser.role)) {
    tabs.push({
      label: 'Novedades',
      icon: <FaNewspaper />,
      component: (
        <NovedadesPanel
          currentUserId={currentUser._id}
          currentUserName={currentUser.name}
          assignedParkingId={assignedParking?._id}
          role={currentUser.role as 'client' | 'owner' | 'operator'}
        />
      ),
    });
  }

  return (
    <div className="space-y-5">
      <div className="dashboard-section p-5 md:p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard Operador</h2>
            <p className="mt-1 text-sm text-gray-500">
              {assignedParking?.name ?? 'Sin playa asignada'}
            </p>
          </div>
        </div>
      </div>

      <div className="dashboard-section p-5 md:p-6">
        <Tab.Group>
          <Tab.List className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
            {tabs.map((tab, idx) => (
              <Tab
                key={idx}
                className={({ selected }) =>
                  classNames(
                    'inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition',
                    selected
                      ? 'border-gray-300 bg-gray-200 text-gray-800'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
                  )
                }
              >
                {tab.icon} {tab.label}
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels className="mt-6">
            {tabs.map((tab, idx) => (
              <Tab.Panel key={idx}>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 md:p-5">{tab.component}</div>
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
}
