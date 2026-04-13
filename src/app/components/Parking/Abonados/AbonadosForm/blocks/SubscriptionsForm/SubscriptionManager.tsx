'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ClientForm } from './ClientForm';
import { AccessForm } from './AccessForm';
import { PaymentForm } from './PaymentForm';
import { SubscriptionsTable } from './SubscriptionsTable';
import { useSubscriptionContext } from '@/app/context/SubscriptionContext';
import { ISubscription } from '@/interfaces/Abono/subscription';
import { User } from '@/interfaces/user';
import { SubTarifa } from '@/interfaces/Tarifa/tarifa';

export const SubscriptionManager: React.FC<{ userId?: string }> = ({ userId }) => {
  const {
    users,
    parkings,
    tarifas,
    subscriptions,
    plazas,
    loadingUsers,
    loadingParkings,
    loadingTarifas,
    loadingSubscriptions,
    loadingPlazas,
    errorUsers,
    errorParkings,
    errorTarifas,
    errorSubscriptions,
    errorPlazas,
    currentUser, // <- usuario logueado
    fetchSubscriptions,
    createSubscription,
    updateSubscription,
    deleteSubscription,
  } = useSubscriptionContext();

  // 🔍 Log completo del contexto incluyendo operador logueado
  console.log('[SubscriptionManager] Context data:', {
    users,
    parkings,
    tarifas,
    subscriptions,
    plazas,
    loadingUsers,
    loadingParkings,
    loadingTarifas,
    loadingSubscriptions,
    loadingPlazas,
    errorUsers,
    errorParkings,
    errorTarifas,
    errorSubscriptions,
    errorPlazas,
    currentUser, // <-- acá aparece el operador logueado
  });

  const [editing, setEditing] = useState<ISubscription | null>(null);
  const [form, setForm] = useState<Partial<ISubscription> & { parkingId?: string }>({
    userId: userId || '',
    parkingId: '',
    assignedParking: '',
    medioAcceso: 'ticket',
    fechaAlta: '',
    vigenciaHasta: '',
    tipoPago: 'efectivo',
    idMedioAcceso: '',
    periodoExtension: 0,
  });

  // Tabs state
  const [activeTab, setActiveTab] = useState<'form' | 'table'>('form');

  // --- Fetch subscriptions on mount ---
  useEffect(() => {
    fetchSubscriptions(userId);
  }, [fetchSubscriptions, userId]);

  // --- Selected user and parking ---
  const selectedUser: User | undefined = users.find(u => u._id === form.userId);
  const selectedParkingId: string | undefined = form.parkingId;

  // --- Tarifas disponibles ---
  const tarifasDisponibles: SubTarifa[] = useMemo(() => {
    if (!selectedParkingId || !selectedUser?.categoriaVehiculo) return [];
    return tarifas
      .filter(t => t.parkinglotId === selectedParkingId && t.category === selectedUser.categoriaVehiculo)
      .flatMap(t =>
        t.tarifaMensual?.map((m, index) => ({
          ...m,
          _id: `${t.parkinglotId}-mensual-${index}`, // id único temporal
          category: t.category,
          tipoEstadia: 'mes' as const,
        })) ?? []
      );
  }, [tarifas, selectedParkingId, selectedUser?.categoriaVehiculo]);

  // --- Handlers ---
  const handleSave = async () => {
    if (!form.userId) return alert('Debe seleccionar un cliente');
    const normalizedForm: Partial<ISubscription> = { ...form, assignedParking: form.assignedParking };
    if (editing?._id) {
      const updated = await updateSubscription(editing._id, normalizedForm);
      if (updated) handleCancel();
    } else {
      const created = await createSubscription(normalizedForm);
      if (created) handleCancel();
    }
  };

  const handleEdit = (sub: ISubscription) => {
    setEditing(sub);
    setForm({ ...sub, parkingId: (sub.assignedParking as any)?._id || sub.assignedParking || '' });
    setActiveTab('form'); // al editar, cambiar al tab del formulario
  };

  const handleCancel = () => {
    setEditing(null);
    setForm({
      userId: userId || '',
      parkingId: '',
      assignedParking: '',
      medioAcceso: 'ticket',
      fechaAlta: '',
      vigenciaHasta: '',
      tipoPago: 'efectivo',
      idMedioAcceso: '',
      periodoExtension: 0,
    });
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm('¿Seguro que quieres eliminar este abono?')) return;
    await deleteSubscription(id);
  };

  const isLoading = loadingUsers || loadingParkings || loadingTarifas || loadingSubscriptions || loadingPlazas;
  const errorMessage = errorUsers || errorParkings || errorTarifas || errorSubscriptions || errorPlazas;

  return (
    <div className="p-4 bg-white rounded shadow space-y-4">
      <h3 className="text-xl font-semibold">Administrar Abonos</h3>
      {errorMessage && <div className="text-red-600">{errorMessage}</div>}

      {/* --- Tabs --- */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          className={`px-4 py-2 -mb-px font-semibold ${
            activeTab === 'form' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'
          }`}
          onClick={() => setActiveTab('form')}
        >
          Crear / Editar Abono
        </button>
        <button
          className={`px-4 py-2 -mb-px font-semibold ${
            activeTab === 'table' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'
          }`}
          onClick={() => setActiveTab('table')}
        >
          Lista de Abonos
        </button>
      </div>

      {/* --- Tab Content --- */}
      {activeTab === 'form' && (
        <div className="space-y-4">
          <ClientForm
            users={users}
            parkings={parkings}
            form={form}
            onChange={(partial) => setForm(prev => ({ ...prev, ...partial }))}
          />

          <AccessForm
            form={form}
            tiposPago={['efectivo', 'tarjeta', 'transferencia']}
            onChange={(partial) => setForm(prev => ({ ...prev, ...partial }))}
          />

          <div className="flex gap-2">
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded"
              onClick={handleSave}
              disabled={isLoading}
            >
              {editing ? 'Actualizar' : 'Crear'}
            </button>
            {editing && (
              <button className="bg-gray-400 text-white px-4 py-2 rounded" onClick={handleCancel}>
                Cancelar
              </button>
            )}
          </div>
        </div>
      )}

      {activeTab === 'table' && (
        <SubscriptionsTable
          subscriptions={subscriptions}
          users={users}
          parkings={parkings}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default SubscriptionManager;
