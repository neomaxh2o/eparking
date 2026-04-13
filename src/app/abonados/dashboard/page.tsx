'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import SubscriptionManager from '@/app/components/Parking/Abonados/AbonadosForm/blocks/SubscriptionsForm/SubscriptionManager';
import { SubscriptionProvider, useSubscriptionContext } from '@/app/context/SubscriptionContext';

const SubscriptionsContent = () => {
  const { users, parkings, tarifas, loadingUsers, loadingParkings, loadingTarifas } = useSubscriptionContext();

  if (loadingUsers || loadingParkings || loadingTarifas) return <div>Cargando datos...</div>;

  return (
    <SubscriptionManager
      initialSubscriptions={[]}
      users={users}
      parkings={parkings}
      onSave={(sub) => {
        console.log('Guardando abono:', sub);
      }}
      onDelete={(id) => {
        console.log('Eliminando abono con ID:', id);
      }}
    />
  );
};

const SubscriptionsPage = () => {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div className="p-6">Cargando dashboard...</div>;
  }

  if (!session?.user) {
    return <div className="p-6">Debes iniciar sesión para acceder al dashboard.</div>;
  }

  if (session.user.role !== 'owner' && session.user.role !== 'admin') {
    return <div className="p-6">No autorizado para administrar abonados.</div>;
  }

  return (
    <SubscriptionProvider>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Administración de Abonos</h1>
        <SubscriptionsContent />
      </div>
    </SubscriptionProvider>
  );
};

export default SubscriptionsPage;
