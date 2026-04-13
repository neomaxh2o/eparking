'use client';
import React from 'react';
import { ISubscription } from '@/interfaces/Abono/subscription';
import { User, ParkingRef } from '@/interfaces/user';

interface SubscriptionsTableProps {
  subscriptions: ISubscription[];
  users: User[];
  parkings: ParkingRef[];
  handleEdit: (sub: ISubscription) => void;
  handleDelete: (id?: string) => void;
}

export const SubscriptionsTable: React.FC<SubscriptionsTableProps> = ({
  subscriptions,
  users,
  parkings,
  handleEdit,
  handleDelete,
}) => {

  const getUserName = (userId?: string) => {
    const user = users.find(u => u._id === userId);
    return user ? `${user.name}${user.apellido ? ` ${user.apellido}` : ''}` : 'Desconocido';
  };

  const getParkingName = (parkingId?: string) => {
    const parking = parkings.find(p => p._id === parkingId);
    return parking ? parking.name : 'Desconocido';
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border rounded shadow">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-4 border">Cliente</th>
            <th className="py-2 px-4 border">Parking</th>
            <th className="py-2 px-4 border">Medio Acceso</th>
            <th className="py-2 px-4 border">Tipo Abono</th>
            <th className="py-2 px-4 border">Vigencia</th>
            <th className="py-2 px-4 border">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-4">
                No hay abonos registrados
              </td>
            </tr>
          ) : (
            subscriptions.map(sub => (
              <tr key={sub._id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border">{getUserName(sub.userId)}</td>
                <td className="py-2 px-4 border">{getParkingName(sub.assignedParking as string)}</td>
                <td className="py-2 px-4 border">{sub.medioAcceso}</td>
                <td className="py-2 px-4 border">{sub.tipoTarifa}</td>
                <td className="py-2 px-4 border">
                  {sub.fechaAlta ? new Date(sub.fechaAlta).toLocaleDateString() : '-'} {'->'}{' '}
                  {sub.vigenciaHasta ? new Date(sub.vigenciaHasta).toLocaleDateString() : '-'}
                </td>
                <td className="py-2 px-4 border flex gap-2">
                  <button
                    onClick={() => handleEdit(sub)}
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(sub._id)}
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
