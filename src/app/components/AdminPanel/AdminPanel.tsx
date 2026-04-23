'use client';

import { useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';

import Tabs from '@/app/components/AdminPanel/Tabs';
import PanelPlayas from '@/app/components/AdminPanel/PanelPlayas';
import PanelTarifas from '@/app/components/AdminPanel/PanelTarifas';
import PanelFacturacion from '@/app/components/AdminPanel/PanelFacturacion';
import PanelFlujoOperativo from '@/app/components/AdminPanel/PanelFlujoOperativo';
import PanelControl from '@/app/components/AdminPanel/PanelControl';

import type { TabKey, TabConfig } from '@/interfaces/admin';

type AdminAreaKey = 'flujo-operativo' | 'facturacion' | 'control' | 'infraestructura';

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
  const [activeArea, setActiveArea] = useState<AdminAreaKey>('flujo-operativo');
  const [activeTab, setActiveTab] = useState<TabKey>('flujo-operativo');

  const userId = session?.user?.id ?? '';
  const userRole = session?.user?.role || 'user';
  const panelUserRole: 'client' | 'owner' | 'operator' | 'admin' =
    userRole === 'owner' || userRole === 'operator' || userRole === 'admin' || userRole === 'client'
      ? userRole
      : 'client';
  const tarifasUserRole: 'owner' | 'client' | 'guest' | 'operator' | 'admin' =
    userRole === 'owner' || userRole === 'client' || userRole === 'guest' || userRole === 'operator' || userRole === 'admin'
      ? userRole
      : 'guest';

  const areaTabs = useMemo<Record<AdminAreaKey, AreaTabConfig[]>>(() => ({
    'flujo-operativo': [
      { key: 'flujo-operativo', label: 'Flujo Operativo', content: <PanelFlujoOperativo /> },
    ],
    facturacion: [
      { key: 'facturacion', label: 'Facturación', content: <PanelFacturacion /> },
    ],
    control: [
      { key: 'control', label: 'Control', content: <PanelControl /> },
    ],
    infraestructura: [
      { key: 'parkings', label: 'Playas', content: <PanelPlayas ownerId={userId} userRole={panelUserRole} /> },
      { key: 'tarifas', label: 'Tarifas', content: <PanelTarifas userRole={tarifasUserRole} /> },
    ],
  }), [panelUserRole, tarifasUserRole, userId]);

  const currentAreaTabs = areaTabs[activeArea] ?? [];

  const safeActiveTab = currentAreaTabs.some((tab) => tab.key === activeTab)
    ? activeTab
    : currentAreaTabs[0]?.key;

  const tabs: TabConfig[] = currentAreaTabs.map((tab) => ({
    key: tab.key,
    label: tab.label,
    content: tab.content,
  }));

  const handleAreaChange = (area: AdminAreaKey) => {
    setActiveArea(area);
    const nextTabs = areaTabs[area] ?? [];
    if (nextTabs.length > 0) setActiveTab(nextTabs[0].key);
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
              { key: 'flujo-operativo', label: 'Flujo Operativo' },
              { key: 'facturacion', label: 'Facturación' },
              { key: 'control', label: 'Control' },
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
          {activeArea === 'flujo-operativo' && 'Inicio de jornada y documentos de playa para la operación diaria.'}
          {activeArea === 'facturacion' && 'Facturas, abonados, conciliación y cierres sin destinos fiscales paralelos.'}
          {activeArea === 'control' && 'Resumen operativo e histórico para supervisión y auditoría.'}
          {activeArea === 'infraestructura' && 'Configuración estructural de playas, tarifas y configuración fiscal canónica.'}
        </div>

        {tabs.length > 1 ? <Tabs tabs={tabs} activeTab={safeActiveTab as TabKey} setActiveTab={setActiveTab} /> : null}
      </div>

      <div className="dashboard-section p-4 md:p-6">
        {tabs.find((tab) => tab.key === safeActiveTab)?.content}
      </div>
    </div>
  );
}
