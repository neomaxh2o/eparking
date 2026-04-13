'use client';

import { useState } from 'react';
import { FormValues } from '@/types/abonados';
import { SubscriptionManager, ISubscription, User, Parking } from './SubscriptionsForm/SubscriptionManager';

interface Props {
  form: FormValues;
  setForm: React.Dispatch<React.SetStateAction<FormValues>>;
  userId: string;
  users: User[];
  parkings: Parking[];
}

export default function AltaServicio({ form, setForm, userId, users, parkings }: Props) {
  const [subscriptions, setSubscriptions] = useState<ISubscription[]>([]);

  const handleSave = (subscription: ISubscription) => {
    setSubscriptions(prev => [...prev, subscription]);
    // Opcional: actualizar form con el abono agregado
    setForm(prev => ({
      ...prev,
      tipoAbono: subscription.tipoAbono,
      medioAcceso: subscription.medioAcceso,
      assignedParking: subscription.assignedParking,
      idMedioAcceso: subscription.idMedioAcceso,
      periodoExtension: subscription.periodoExtension
    }));
  };

  const handleDelete = (id: string) => {
    setSubscriptions(prev => prev.filter(s => s._id !== id));
  };

  const currentUser = users.find(u => u._id === userId);

  return (
    <div className="bg-gray-50 p-4 rounded border space-y-4">
      <h3 className="font-semibold text-gray-700 mb-2">Alta de Servicio</h3>
      <p className="text-sm text-gray-600">Usuario registrado: <strong>{userId}</strong></p>

      <SubscriptionManager
        initialSubscriptions={subscriptions}
        users={currentUser ? [currentUser] : []}
        parkings={parkings}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
