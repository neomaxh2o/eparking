'use client';

import { useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';

import Tabs from '@/app/components/AdminPanel/Tabs';
import PanelUsuarios from '@/app/components/AdminPanel/PanelUsuarios';
import PanelPlayas from '@/app/components/AdminPanel/PanelPlayas';
import PanelReservas from '@/app/components/AdminPanel/PanelReservas';
import PanelTarifas from '@/app/components/AdminPanel/PanelTarifas';
import PanelHistoricoCajas from '@/app/components/AdminPanel/PanelHistoricoCajas';
import PanelAbonados from '@/app/components/AdminPanel/PanelAbonados';
import PanelFacturacion from '@/app/components/AdminPanel/PanelFacturacion';
import OwnerOperationsShell from '@/app/components/AdminPanel/OwnerOperationsShell';
import { ClientsNavigationProvider } from '@/app/components/AdminPanel/ClientsNavigationContext';

import type { TabKey, TabConfig } from '@/interfaces/admin';

type AdminAreaKey = 'operacion' | 'clientes' | 'infraestructura';

type AreaTabConfig = {
  key: TabKey;
  label: string;
  content: React.ReactNode;
};

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function AdminPanel() {
  const { data: session, status } = useSession();
  const [activeArea, setActiveArea] = useState<AdminAreaKey>('operacion');
  const [activeTab, setActiveTab] = useState<TabKey>('facturacion');

  const userId = session?.user?.id ?? '';
  const userRole = session?.user?.role || 'user';

  const areaTabs = useMemo<Record<AdminAreaKey, AreaTabConfig[]>>(() => ({
    operacion: userRole === 'owner'
      ? [
          { key: 'facturacion', label: 'Operaciones', content: <OwnerOperationsShell ownerId={userId} activeTab={activeTab} setActiveTab={setActiveTab} /> },
        ]
      : [
          { key: 'facturacion', label: 'Abrir turno', content: <PanelFacturacion /> },
          { key: 'reservations', label: 'Reservas', content: <PanelReservas /> },
          ...(userRole === 'admin'
            ? [{ key: 'historico-cajas' as const, label: 'Histórico de cajas', content: <PanelHistoricoCajas /> }]
            : []),
        ],
    clientes: [
      {
        key: 'users',
        label: 'Usuarios',
        content: (
          <ClientsNavigationProvider
            goToUsers={() => setActiveTab('users')}
            goToAbonados={() => setActiveTab('abonados')}
          >
            <PanelUsuarios />
          </ClientsNavigationProvider>
        ),
      },
      {
        key: 'abonados',
        label: 'Abonados',
        content: (
          <ClientsNavigationProvider
            goToUsers={() => setActiveTab('users')}
            goToAbonados={() => setActiveTab('abonados')}
          >
            <PanelAbonados />
          </ClientsNavigationProvider>
        ),
      },
    ],
    infraestructura: [
      { key: 'parkings', label: 'Playas', content: <PanelPlayas ownerId={userId} userRole={userRole} /> },
      { key: 'tarifas', label: 'Tarifas', content: <PanelTarifas userRole={userRole} /> },
    ],
  }), [userId, userRole]);

  const currentAreaTabs = areaTabs[activeArea] ?? [];

  const safeActiveTab = currentAreaTabs.some((tab) => tab.key === activeTab)
    ? activeTab
    : currentAreaTabs[0]?.key;

  const hideInnerTabs = activeArea === 'operacion' && userRole === 'owner';

  const tabs: TabConfig[] = currentAreaTabs.map((tab) => ({
    key: tab.key,
    label: tab.label,
    content: tab.content,
  }));

  const handleAreaChange = (area: AdminAreaKey) => {
    setActiveArea(area);
    const nextTabs = areaTabs[area] ?? [];
    if (nextTabs.length > 0) {
      setActiveTab(nextTabs[0].key);
    }
  };

  if (status === 'loading') {
    return <p className="p-4 text-center text-sm text-gray-500">Cargando sesión...</p>;
  }

  if (!session || !session.user?.id) {
    return <p className="p-4 text-center text-sm text-red-600">No estás autenticado.</p>;
  }

  return (
    <div className="space-y-5">
      <div className="dashboard-section overflow-hidden p-4 md:p-5">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'operacion', label: 'Operación' },
              { key: 'clientes', label: 'Clientes' },
              { key: 'infraestructura', label: 'Infraestructura' },
            ].map((area) => (
              <button
                key={area.key}
                onClick={() => handleAreaChange(area.key as AdminAreaKey)}
                className={classNames(
                  'rounded-xl border px-4 py-2.5 text-sm font-semibold transition',
                  activeArea === area.key
                    ? 'border-gray-300 bg-gray-200 text-gray-800'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
                )}
              >
                {area.label}
              </button>
            ))}
          </div>

          <div className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
            Rol: {userRole}
          </div>
        </div>

        <div className="mb-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          {activeArea === 'operacion' && (userRole === 'owner' ? 'Entrada operativa del owner: iniciar turno y luego continuar con el flujo operativo.' : 'Flujo diario y operativo: facturación, reservas e histórico de cajas.')}
          {activeArea === 'clientes' && 'Gestión comercial y administrativa de usuarios y abonados.'}
          {activeArea === 'infraestructura' && 'Configuración estructural de playas, tarifas y base operativa.'}
        </div>

        {!hideInnerTabs ? <Tabs tabs={tabs} activeTab={safeActiveTab as TabKey} setActiveTab={setActiveTab} /> : null}
      </div>

      <div className="dashboard-section p-4 md:p-6">
        {tabs.find((tab) => tab.key === safeActiveTab)?.content}
      </div>
    </div>
  );
}
