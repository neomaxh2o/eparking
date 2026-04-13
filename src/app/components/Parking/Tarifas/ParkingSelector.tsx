'use client';

import React, { useState, useMemo } from 'react';
import { Parking } from './types';
import { MapPin } from 'lucide-react';

interface ParkingSelectorProps {
  parkings?: Parking[];
  selectedParkingId: string;
  onChange: (parkingId: string) => void;
  loading?: boolean;
  label?: string;
}

function normalizeParkingId(parking: any): string {
  if (!parking) return '';
  if (typeof parking._id === 'string' && parking._id.trim()) return parking._id.trim();
  if (parking._id && typeof parking._id === 'object') {
    if (typeof parking._id.$oid === 'string' && parking._id.$oid.trim()) return parking._id.$oid.trim();
    if (typeof parking._id.toString === 'function') {
      const value = parking._id.toString();
      if (value && value !== '[object Object]') return value;
    }
  }
  if (typeof parking.id === 'string' && parking.id.trim()) return parking.id.trim();
  return '';
}

export default function ParkingSelector({
  parkings = [],
  selectedParkingId,
  onChange,
  loading = false,
  label = 'Selecciona un estacionamiento',
}: ParkingSelectorProps) {
  const [search, setSearch] = useState('');

  const filteredParkings = useMemo(() => {
    const normalized = parkings
      .map((p: any) => ({ ...p, _normalizedId: normalizeParkingId(p) }))
      .filter((p: any) => p._normalizedId && p.name && p.location?.address);

    if (!search) return normalized;

    return normalized.filter(
      (p: any) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.location.address.toLowerCase().includes(search.toLowerCase()),
    );
  }, [search, parkings]);

  return (
    <div className="space-y-3">
      <label htmlFor="parking-select" className="block text-sm font-semibold text-gray-700">
        {label}
      </label>

      <div className="relative">
        <input
          type="text"
          placeholder="Buscar estacionamiento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={loading || !parkings.length}
          className={`w-full rounded-xl border px-10 py-3 text-sm outline-none transition-colors ${
            loading || !parkings.length
              ? 'cursor-not-allowed border-gray-200 bg-gray-100'
              : 'border-gray-300 bg-white focus:border-gray-500'
          }`}
        />
        <MapPin className="absolute left-3 top-3.5 text-gray-400" size={18} />
      </div>

      <select
        id="parking-select"
        value={selectedParkingId}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading || !filteredParkings.length}
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-500"
      >
        <option value="" disabled>
          {loading ? 'Cargando...' : filteredParkings.length ? '-- Seleccionar --' : 'No hay resultados'}
        </option>
        {filteredParkings.map((parking: any, index: number) => (
          <option key={`${parking._normalizedId}-${parking.name}-${index}`} value={parking._normalizedId}>
            {parking.name} — {parking.location?.address ?? 'Sin dirección'}
          </option>
        ))}
      </select>

      {!parkings.length && !loading ? (
        <p className="text-sm text-gray-500">No hay estacionamientos disponibles.</p>
      ) : null}
    </div>
  );
}
