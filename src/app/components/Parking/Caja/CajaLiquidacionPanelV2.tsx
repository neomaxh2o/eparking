'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import TurnoPanel from '@/app/components/Parking/Estadias/TurnoPanel';

export default function CajaLiquidacionPanelV2() {
  const { data: session } = useSession();
  const operatorId = session?.user?.id ?? '';

  if (!operatorId) {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h2 className="text-xl font-bold text-red-700">Operador no autenticado</h2>
        <p className="mt-2 text-sm text-red-600">
          Debés iniciar sesión para operar liquidación y cierre.
        </p>
      </section>
    );
  }

  return <TurnoPanel operatorId={operatorId} />;
}
