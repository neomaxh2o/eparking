'use client';

import React, { useEffect } from 'react';
import { TarifasList } from '@/app/components/AdminPanel/Tarifas/TarifasList';
import { useTarifas } from '@/app/hooks/Parking/useTarifas';
import type { Parking } from '@/interfaces/parking';
import type { Tarifa } from '@/interfaces/tarifa';

interface TarifasParkingCardProps {
  parking: Parking;
  onClose: () => void;
  userRole: 'operator' | 'client' | 'owner' | 'admin' | 'guest';
}

export default function TarifasParkingCard({
  parking,
  onClose,
  userRole,
}: TarifasParkingCardProps) {
  const { tarifas = [], loading, error, fetchTarifas } = useTarifas();

  useEffect(() => {
    fetchTarifas();
  }, [fetchTarifas]);

  const tarifasFiltradas: Tarifa[] = tarifas.filter(
    (t) => t.parkinglotId === parking._id
  );

  const handleSelectTarifa = (tarifa: Tarifa) => {
    console.log('Editar tarifa:', tarifa);
  };

  const handleReservar = (tarifa: Tarifa) => {
    console.log('Reservar tarifa:', tarifa);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-5xl w-full p-8 relative overflow-y-auto max-h-[90vh] animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          aria-label="Cerrar modal"
          className="absolute top-4 right-4 text-gray-700 hover:text-red-600 text-3xl font-bold transition-colors"
        >
          &times;
        </button>

        {/* Título */}
        <h2 className="text-3xl font-semibold mb-6 text-gray-900 sticky top-0 bg-white pt-4 pb-2 z-10 border-b">
          {parking.name}
        </h2>

        {/* Contenido */}
        {loading ? (
          <p className="text-center py-4">Cargando tarifas...</p>
        ) : error ? (
          <p className="text-red-600 text-center py-4">{error}</p>
        ) : tarifasFiltradas.length === 0 ? (
          <p className="text-center text-gray-600 py-4">
            No hay tarifas registradas para esta playa.
          </p>
        ) : (
          <TarifasList
            tarifas={tarifasFiltradas}
            userRole={userRole}
            onSelectTarifa={handleSelectTarifa}
            onReservar={handleReservar}
          />
        )}

        {/* Botón cerrar abajo */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-6 rounded transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
