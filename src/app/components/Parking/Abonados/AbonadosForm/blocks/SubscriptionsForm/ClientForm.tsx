'use client';
import React from 'react';
import { User, ParkingRef } from '@/interfaces/user';
import { ISubscription } from '@/interfaces/Abono/subscription';

interface ClientFormProps {
  users: User[];
  parkings: ParkingRef[];
  form: Partial<ISubscription>;
  onChange: (form: Partial<ISubscription>) => void;
}

export const ClientForm: React.FC<ClientFormProps> = ({
  users,
  parkings,
  form,
  onChange,
}) => {
  const selectedUser = users.find(u => u._id === form.userId);
  const assignedParkingId = selectedUser?.assignedParkingId || '';
  const parkingName = assignedParkingId
    ? parkings.find(p => p._id === assignedParkingId)?.name || 'Desconocido'
    : '';

  const handleUserChange = (userId: string) => {
    const user = users.find(u => u._id === userId);
    onChange({
      userId,
      assignedParking: user?.assignedParkingId || '',
      categoriaVehiculo: user?.categoriaVehiculo || '',
      patenteVehiculo: user?.patenteVehiculo || '',
    });
  };

  return (
    <div className="mb-6 border p-4 rounded bg-gray-50">
      <h4 className="font-semibold mb-2">Cliente</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cliente */}
        <div>
          <label className="block text-sm font-medium mb-1">Seleccionar Cliente</label>
          <select
            value={form.userId || ''}
            onChange={e => handleUserChange(e.target.value)}
            className="border p-2 rounded w-full"
          >
            <option value="">Selecciona un cliente</option>
            {users
              .filter(u => u.role === 'client')
              .map(u => (
                <option key={u._id} value={u._id}>
                  {u.name} {u.apellido ? `(${u.apellido})` : ''}
                </option>
              ))}
          </select>
        </div>

        {/* Parking asignado */}
        <div>
          <label className="block text-sm font-medium mb-1">Parking Asignado</label>
          <input
            type="text"
            value={form.userId ? `${parkingName} (${assignedParkingId})` : ''}
            readOnly
            className="border p-2 rounded w-full bg-gray-100"
          />
        </div>

        {/* Categoría del vehículo */}
        <div>
          <label className="block text-sm font-medium mb-1">Categoría del Vehículo</label>
          <input
            type="text"
            value={form.categoriaVehiculo || ''}
            readOnly
            className="border p-2 rounded w-full bg-gray-200"
          />
        </div>

        {/* Patente del cliente */}
        <div>
          <label className="block text-sm font-medium mb-1">Patente</label>
          <input
            type="text"
            value={form.patenteVehiculo || ''}
            readOnly
            className="border p-2 rounded w-full bg-gray-200"
          />
        </div>
      </div>
    </div>
  );
};
