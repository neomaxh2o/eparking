'use client';

import { useState } from 'react';
import { Tab } from '@headlessui/react';
import OwnerOperationsSummary from '@/app/components/AdminPanel/OwnerOperationsSummary';
import PanelHistoricoCajas from '@/app/components/AdminPanel/PanelHistoricoCajas';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function PanelControl() {
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);

  return (
    <div className="space-y-6">
      <div className="dashboard-section p-5 md:p-6 space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Control</h2>
          <p className="mt-1 text-sm text-gray-500">Capa de supervisión, auditoría e histórico. Resumen operativo e histórico quedan consolidados acá.</p>
        </div>

        <Tab.Group selectedIndex={selectedTabIndex} onChange={setSelectedTabIndex}>
          <Tab.List className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
            {['Resumen operativo', 'Histórico'].map((tab) => (
              <Tab
                key={tab}
                className={({ selected }) => classNames(
                  'inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition',
                  selected ? 'border-gray-300 bg-gray-200 text-gray-800' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
                )}
              >
                {tab}
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels className="mt-6 space-y-6">
            <Tab.Panel>
              <OwnerOperationsSummary />
            </Tab.Panel>
            <Tab.Panel>
              <PanelHistoricoCajas />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
}
