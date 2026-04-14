'use client';

import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import ParkingList from '@/app/components/Parking/Tarifas/ParkingList';
import ParkingCreateForm from '@/app/components/AdminPanel/AdminParking/ParkingCreateForm';
import NovedadesPanel from '@/app/components/AdminPanel/AdminParking/Novedades/NovedadesPanel';
import ParkingBillingProfilePanel from '@/app/components/AdminPanel/AdminParking/ParkingBillingProfilePanel';
import { FaPlusCircle, FaList, FaChartBar, FaStickyNote, FaFileInvoiceDollar } from 'react-icons/fa';

interface PanelPlayasProps {
  ownerId: string;
  userRole: 'client' | 'owner' | 'operator' | 'admin';
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function PanelPlayas({ ownerId, userRole }: PanelPlayasProps) {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg(null);
        setErrorMsg(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, errorMsg]);

  return (
    <div className="space-y-6">
      <div className="dashboard-section p-5 md:p-6">
        <h2 className="text-2xl font-bold text-gray-900">Panel de Playas</h2>
        <p className="mt-1 text-sm text-gray-500">Gestión de parkings, novedades y administración general de playas.</p>
      </div>

      {successMsg ? <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">{successMsg}</div> : null}
      {errorMsg ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errorMsg}</div> : null}

      <div className="dashboard-section p-5 md:p-6">
        <Tab.Group>
          <Tab.List className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
            <Tab className={({ selected }) => classNames('inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition', selected ? 'border-gray-300 bg-gray-200 text-gray-800' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50')}><FaPlusCircle /> Registrar Playa</Tab>
            <Tab className={({ selected }) => classNames('inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition', selected ? 'border-gray-300 bg-gray-200 text-gray-800' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50')}><FaList /> Ver / Editar</Tab>
            <Tab className={({ selected }) => classNames('inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition', selected ? 'border-gray-300 bg-gray-200 text-gray-800' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50')}><FaFileInvoiceDollar /> Config. Fiscal</Tab>
            <Tab className={({ selected }) => classNames('inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition', selected ? 'border-gray-300 bg-gray-200 text-gray-800' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50')}><FaStickyNote /> Novedades</Tab>
            <Tab className={({ selected }) => classNames('inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition', selected ? 'border-gray-300 bg-gray-200 text-gray-800' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50')}><FaChartBar /> Estadísticas</Tab>
          </Tab.List>

          <Tab.Panels className="mt-6">
            <Tab.Panel>
              <ParkingCreateForm onSuccess={(msg) => { setSuccessMsg(msg); setErrorMsg(null); }} onError={(msg) => { setErrorMsg(msg); setSuccessMsg(null); }} />
            </Tab.Panel>
            <Tab.Panel>
              <ParkingList ownerId={ownerId} currentUserId={ownerId} userRole={userRole} />
            </Tab.Panel>
            <Tab.Panel>
              <ParkingBillingProfilePanel ownerId={userRole === 'owner' ? ownerId : undefined} />
            </Tab.Panel>
            <Tab.Panel>
              <NovedadesPanel />
            </Tab.Panel>
            <Tab.Panel>
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">
                Aquí se mostrarán estadísticas de uso en una próxima iteración.
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
}
