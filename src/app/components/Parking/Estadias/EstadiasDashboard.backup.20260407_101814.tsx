'use client';

import React from 'react';
import IngresoEstadia from '@/app/components/Parking/Estadias/IngresoEstadia';
import SalidaEstadia from '@/app/components/Parking/Estadias/SalidaEstadia';

interface EstadiasDashboardProps {
  nombreEstacionamiento?: string;
}

export default function EstadiasDashboard({
  nombreEstacionamiento = 'Estacionamiento',
}: EstadiasDashboardProps) {
  const refresh = async () => {
    return;
  };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estadías</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestión operativa de ingresos y salidas.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <IngresoEstadia />
        <SalidaEstadia
          nombreEstacionamiento={nombreEstacionamiento}
          refresh={refresh}
        />
      </section>
    </div>
  );
}
