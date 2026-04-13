'use client';

import React, { useState, useEffect } from 'react';
import { useReservations } from '@/app/hooks/Reservations/useReservations';
import { useUsers } from '@/app/hooks/Users/useUsers';
import { useSession } from 'next-auth/react';
import ReservationFilters from './ReservationFilters';
import Pagination from './Pagination';
import { ReservationExtended } from '@/interfaces/reservations';

export default function ReservationList() {
  const { reservations, loading, error } = useReservations();
  const { users } = useUsers();
  const { data: session } = useSession();

  const [localReservations, setLocalReservations] = useState<ReservationExtended[]>([]);
  const [filters, setFilters] = useState<any>({});
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setLocalReservations(reservations as ReservationExtended[]);
  }, [reservations]);

  const RESERVATIONS_PER_PAGE = 6;

  const filteredReservations = localReservations.filter(r => {
    const search = filters.search?.toLowerCase() ?? '';
    const inSearch =
      r.nombre?.toLowerCase().includes(search) ||
      r.apellido?.toLowerCase().includes(search) ||
      r.patenteVehiculo?.toLowerCase().includes(search) ||
      r._id?.toLowerCase().includes(search);

    const statusMatch = filters.status ? r.status === filters.status : true;
    const fromMatch = filters.dateFrom ? new Date(r.startTime) >= new Date(filters.dateFrom) : true;
    const toMatch = filters.dateTo ? new Date(r.endTime) <= new Date(filters.dateTo) : true;

    return inSearch && statusMatch && fromMatch && toMatch;
  });

  const totalPages = Math.ceil(filteredReservations.length / RESERVATIONS_PER_PAGE);
  const paginatedReservations = filteredReservations.slice(
    (currentPage - 1) * RESERVATIONS_PER_PAGE,
    currentPage * RESERVATIONS_PER_PAGE,
  );

  if (loading) {
    return <p className="text-sm text-gray-500">Cargando reservas...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  return (
    <div className="space-y-5">
      <div className="dashboard-section p-4 md:p-5">
        <ReservationFilters onFilterChange={setFilters} />
      </div>

      {!paginatedReservations.length ? (
        <div className="dashboard-section p-6 text-sm text-gray-600">
          No hay reservas para los filtros seleccionados.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {paginatedReservations.map((r) => (
            <div key={r._id} className="dashboard-section p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {r.nombre} {r.apellido}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">{r.patenteVehiculo || 'Sin patente'}</p>
                </div>
                <span className="rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                  {r.status || 'pendiente'}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <p><strong>Ingreso:</strong> {r.startTime ? new Date(r.startTime).toLocaleString() : '-'}</p>
                <p><strong>Salida:</strong> {r.endTime ? new Date(r.endTime).toLocaleString() : '-'}</p>
                <p><strong>Monto:</strong> ${Number(r.amountPaid ?? 0).toFixed(2)}</p>
                <p><strong>Pago:</strong> {r.formaPago || '-'}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="dashboard-section p-4">
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
}
