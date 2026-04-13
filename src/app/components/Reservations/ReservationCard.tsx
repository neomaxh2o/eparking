'use client';

import React from 'react';
import { MapPin } from 'lucide-react';
import { ReservationExtended, ParkingLotType } from '@/interfaces/reservations';
import { formatAddress } from '@/utils/addressFormatter';

interface ReservationCardProps {
  reservation: ReservationExtended;
  onClick: () => void;
  onMapClick: (address: string, lat: number, lng: number) => void;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800',
};

export default function ReservationCard({ reservation, onClick, onMapClick }: ReservationCardProps) {
  const parkingLot = reservation.parkingLot as ParkingLotType;
  const hasLocation = typeof parkingLot === 'object' && 'location' in parkingLot && parkingLot.location;

  const address = hasLocation ? formatAddress(parkingLot.location.address) : '';

  const needsPayment = reservation.status === 'confirmed' && (!reservation.amountPaid || reservation.amountPaid === 0);

  return (
    <div
      className="border rounded-lg shadow hover:shadow-lg cursor-pointer transition relative p-4 bg-white"
      onClick={onClick}
    >
      {/* Nombre del parking y badge */}
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-bold">{parkingLot?.name ?? 'Playa desconocida'}</h3>
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
            statusColors[reservation.status || 'pending'] || 'bg-gray-100 text-gray-700'
          }`}
        >
          {reservation.status?.toUpperCase() ?? 'SIN ESTADO'}
        </span>
      </div>

      {/* Nombre del cliente */}
      <p className="text-sm text-gray-600 mb-1">
        {typeof reservation.user === 'string' ? reservation.user : reservation.user.name || 'Sin nombre'}
      </p>

      {/* Montos y operador */}
      <div className="flex justify-between items-center mt-2">
        <p className={needsPayment ? 'text-red-600 font-bold' : 'text-green-700 font-semibold'}>
          ${reservation.amountPaid?.toFixed(2) ?? '0.00'}
        </p>
        {reservation.processedBy && <p className="text-sm text-gray-500">{reservation.processedBy}</p>}
      </div>

      {hasLocation && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMapClick(parkingLot.location.address, parkingLot.location.lat, parkingLot.location.lng);
          }}
          className="mt-2 text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
        >
          <MapPin size={16} /> Ver ubicación
        </button>
      )}
    </div>
  );
}
