'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { LogIn, UserPlus, LayoutDashboard, List } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';

import RegisterUserForm from '@/app/components/Users/Register/UserRegisterForm';
import LoginForm from '@/app/components/Users/Login/LoginForm';
import ClosestParking from '@/app/components/ClosestParking';
import UserPanel from '@/app/components/UserPanel/UserPanel';

const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-6 w-1/4 rounded bg-gray-200"></div>
    <div className="h-6 w-1/2 rounded bg-gray-200"></div>
    <div className="h-6 w-3/4 rounded bg-gray-200"></div>
    <div className="h-48 rounded-2xl bg-gray-200"></div>
  </div>
);

const ParkingList = dynamic(() => import('@/app/components/Parking/Tarifas/ParkingList'), {
  ssr: false,
  loading: () => <LoadingSkeleton />,
});
const AdminPanel = dynamic(() => import('@/app/components/AdminPanel/AdminPanel'), {
  ssr: false,
  loading: () => <LoadingSkeleton />,
});
const OperatorDashboard = dynamic(() => import('@/app/components/AdminPanel/AdminParking/OperatorDashboard'), {
  ssr: false,
  loading: () => <LoadingSkeleton />,
});

type UserRole = 'operator' | 'client' | 'owner' | 'admin' | 'guest';

type Tab = {
  id: string;
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  allowedRoles?: UserRole[];
};

const tabs: Tab[] = [
  { id: 'login', label: 'Iniciar Sesión', icon: <LogIn size={18} />, component: <LoginForm />, allowedRoles: ['guest'] },
  { id: 'register', label: 'Registrar Usuario', icon: <UserPlus size={18} />, component: <RegisterUserForm />, allowedRoles: ['guest'] },
  { id: 'list-parking', label: 'Listar Playas', icon: <List size={18} />, component: <ParkingList />, allowedRoles: ['client'] },
  { id: 'closest-parking', label: 'Playa más cercana', icon: <List size={18} />, component: <ClosestParking />, allowedRoles: ['client'] },
  { id: 'admin-panel', label: 'Panel de Administración', icon: <LayoutDashboard size={18} />, component: <AdminPanel />, allowedRoles: ['owner', 'admin'] },
  { id: 'user-panel', label: 'Panel Usuario', icon: <List size={18} />, component: <UserPanel />, allowedRoles: ['client'] },
  { id: 'operator-dashboard', label: 'Dashboard Operador', icon: <LayoutDashboard size={18} />, component: <OperatorDashboard />, allowedRoles: ['operator'] },
];

const AuthWrapper = ({ userId, children }: { userId?: string; children: React.ReactNode }) => {
  if (!userId) return <p>Usuario no autenticado</p>;
  return <>{children}</>;
};

export default function HomePageTabs() {
  const { data: session, status } = useSession();

  const allowedRoles: UserRole[] = ['operator', 'client', 'owner', 'admin', 'guest'];
  const userRoleRaw = session?.user?.role;
  const userId = session?.user?.id;
  const userRole: UserRole = allowedRoles.includes(userRoleRaw as UserRole) ? (userRoleRaw as UserRole) : 'guest';

  const filteredTabs = tabs.filter(tab => tab.allowedRoles?.includes(userRole));
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [prevTabComponent, setPrevTabComponent] = useState<React.ReactNode | null>(null);
  const [fade, setFade] = useState<boolean>(true);

  useEffect(() => {
    if (filteredTabs.length > 0 && !filteredTabs.find(tab => tab.id === activeTabId)) {
      setActiveTabId(filteredTabs[0].id);
    }
  }, [filteredTabs, activeTabId]);

  const getTabComponent = (tabId: string | undefined) => {
    if (!tabId) return null;
    switch (tabId) {
      case 'list-parking':
        return <AuthWrapper userId={userId}><ParkingList currentUserId={userId!} userRole={userRole} /></AuthWrapper>;
      case 'operator-dashboard':
        return <AuthWrapper userId={userId}><OperatorDashboard currentUserId={userId!} /></AuthWrapper>;
      case 'admin-panel':
        return <AdminPanel />;
      default:
        return tabs.find(t => t.id === tabId)?.component ?? null;
    }
  };

  const handleTabChange = (tabId: string) => {
    if (tabId === activeTabId) return;
    setPrevTabComponent(getTabComponent(activeTabId));
    setFade(false);
    setTimeout(() => {
      setActiveTabId(tabId);
      setFade(true);
    }, 160);
  };

  return (
    <div className="dashboard-shell min-h-screen">
      <div className="dashboard-panel overflow-hidden p-4 md:p-6">
        <div className="mb-6 flex flex-col gap-4 border-b border-gray-200 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="dashboard-title text-3xl font-bold md:text-4xl">e-Parking Dashboard</h1>
            <p className="dashboard-subtitle mt-2 text-sm md:text-base">
              Operación, administración y control centralizado del sistema.
            </p>
          </div>

          {session ? (
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="rounded-xl border border-gray-300 bg-gray-200 px-5 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-300"
            >
              Cerrar Sesión
            </button>
          ) : null}
        </div>

        {status === 'loading' ? (
          <LoadingSkeleton />
        ) : (
          <>
            <nav className="mb-6 flex flex-wrap gap-2" role="tablist">
              {filteredTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  role="tab"
                  aria-selected={activeTabId === tab.id}
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                    activeTabId === tab.id
                      ? 'border-gray-300 bg-gray-200 text-gray-800 shadow-sm'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>

            <section className="dashboard-section relative min-h-[420px] overflow-hidden p-4 md:p-6">
              {prevTabComponent && !fade && (
                <div className="absolute inset-0 p-4 opacity-0 transition-opacity duration-150 md:p-6">
                  {prevTabComponent}
                </div>
              )}
              <div className={`transition-opacity duration-150 ${fade ? 'opacity-100' : 'opacity-0'}`}>
                {getTabComponent(activeTabId)}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
