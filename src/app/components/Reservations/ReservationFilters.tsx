'use client';

import React, { useState } from 'react';

interface ReservationFiltersProps {
  onFilterChange: (filters: any) => void;
}

export default function ReservationFilters({ onFilterChange }: ReservationFiltersProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const handleChange = (next: {
    search?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const updated = {
      search: next.search ?? search,
      status: next.status ?? status,
      dateFrom: next.dateFrom ?? dateFrom,
      dateTo: next.dateTo ?? dateTo,
    };

    onFilterChange(updated);
  };

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      <input
        type="text"
        placeholder="Buscar por cliente, patente o reserva"
        value={search}
        onChange={(e) => {
          const value = e.target.value;
          setSearch(value);
          handleChange({ search: value });
        }}
        className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-500"
      />

      <select
        value={status}
        onChange={(e) => {
          const value = e.target.value;
          setStatus(value);
          handleChange({ status: value });
        }}
        className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-500"
      >
        <option value="">Todos los estados</option>
        <option value="pending">Pendiente</option>
        <option value="confirmed">Confirmada</option>
        <option value="cancelled">Cancelada</option>
        <option value="completed">Completada</option>
      </select>

      <input
        type="date"
        value={dateFrom}
        onChange={(e) => {
          const value = e.target.value;
          setDateFrom(value);
          handleChange({ dateFrom: value });
        }}
        className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-500"
      />

      <input
        type="date"
        value={dateTo}
        onChange={(e) => {
          const value = e.target.value;
          setDateTo(value);
          handleChange({ dateTo: value });
        }}
        className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-500"
      />
    </div>
  );
}
