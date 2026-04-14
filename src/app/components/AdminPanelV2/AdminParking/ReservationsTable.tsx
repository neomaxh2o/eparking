'use client';

import React, { useMemo } from 'react';
import { useReservations, Reservation } from '@/app/hooks/Reservations/useReservations';

interface ReservationsTableProps {
  assignedParkingId: string;
}

export default function ReservationsTable({ assignedParkingId }: ReservationsTableProps) {
  const { reservations, loading, error } = useReservations();

  // Filtrar solo reservas del parking asignado
  const filteredReservations = useMemo(() => {
    if (!assignedParkingId) return [];
    return reservations.filter((r) => {
      // parkingLot puede ser string o objeto, chequeamos ambos casos
      if (typeof r.parkingLot === 'string') {
        return r.parkingLot === assignedParkingId;
      } else {
        return r.parkingLot._id === assignedParkingId;
      }
    });
  }, [reservations, assignedParkingId]);

  if (!assignedParkingId) {
    return <p className="text-center text-gray-600">No hay playa asignada para mostrar reservas.</p>;
  }

  if (loading) return <p className="text-center mt-6">Cargando reservas...</p>;
  if (error) return <p className="text-center text-red-500 mt-6">Error: {error}</p>;

  if (filteredReservations.length === 0) {
    return <p className="text-center text-gray-600 mt-6">No hay reservas para la playa asignada.</p>;
  }

  return (
    <div className="max-w-full overflow-x-auto mt-8">
      <div className="grid grid-cols-6 gap-4 bg-yellow-200 text-yellow-900 font-semibold p-3 rounded-t-lg">
        <div>Cliente</div>
        <div>Patente</div>
        <div>Inicio</div>
        <div>Fin</div>
        <div>Estado</div>
        <div>Acciones</div>
      </div>

      {filteredReservations.map((reservation: Reservation) => (
        <div
          key={reservation._id}
          className="grid grid-cols-6 gap-4 border-b border-yellow-300 p-3 items-center hover:bg-yellow-50"
        >
          <div>{reservation.nombre + ' ' + reservation.apellido}</div>
          <div>{reservation.patenteVehiculo}</div>
          <div>{new Date(reservation.startTime).toLocaleString()}</div>
          <div>{new Date(reservation.endTime).toLocaleString()}</div>
          <div>
            <span
              className={`inline-block px-2 py-1 rounded text-white text-xs font-semibold ${
                reservation.status === 'confirmed'
                  ? 'bg-green-600'
                  : reservation.status === 'completed'
                  ? 'bg-gray-600'
                  : reservation.status === 'cancelled'
                  ? 'bg-red-600'
                  : 'bg-yellow-600'
              }`}
            >
              {reservation.status
                ? reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)
                : 'Pendiente'}
            </span>
          </div>
          <div>
            <button className="text-blue-600 hover:underline">Ver</button>
          </div>
        </div>
      ))}
    </div>
  );
}
