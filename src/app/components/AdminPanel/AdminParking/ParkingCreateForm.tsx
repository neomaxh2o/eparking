'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useCreateParking } from '@/modules/parking/hooks/useCreateParking';
import {
  FiHome,
  FiMapPin,
  FiHash,
  FiClock,
  FiDollarSign,
  FiUser,
  FiMap,
} from 'react-icons/fi';
import LocationPicker from '@/app/components/AdminPanel/AdminParking/LocationPicker';

interface ParkingCreateFormProps {
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
}

export default function ParkingCreateForm({ onSuccess, onError }: ParkingCreateFormProps) {
  const { data: session } = useSession();

  // use hook-managed form
  const { form, updateField, submit, loading, error, response } = useCreateParking();

  useEffect(() => {
    if (session?.user?.id) {
      updateField('owner', session.user.id);
    }
  }, [session]);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  useEffect(() => {
    if (response?.message && onSuccess) {
      onSuccess(response.message);
    }
  }, [response, onSuccess]);

  // Logea la ubicación cada vez que cambia
  useEffect(() => {
    console.log('Ubicación actualizada:', form.location);
  }, [form.location]);

  const handleChange = (field: string, value: any) => {
    if (field.startsWith('schedule.')) {
      const key = field.split('.')[1];
      updateField(`schedule.${key}`, value);
    } else if (!field.startsWith('location.')) {
      updateField(field, value);
    }
  };

  // Actualiza ubicación desde LocationPicker
  const handleLocationChange = (location: { lat: number; lng: number; address: string }) => {
    updateField('location', location);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submit();
    } catch {
      if (onError) onError('Error inesperado al crear la playa');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl mx-auto p-4 bg-gray-50 dark:bg-gray-900 rounded-lg shadow-md font-sans text-gray-900 dark:text-gray-100"
      aria-label="Formulario para registrar nueva playa de estacionamiento"
    >
      <div className="grid grid-cols-1 gap-4">
        {/* Nombre */}
        <div className="flex items-center space-x-3">
          <FiHome className="text-gray-500 dark:text-gray-400 w-5 h-5" />
          <label htmlFor="name" className="min-w-[6rem] text-base font-medium">Nombre</label>
          <input
            id="name"
            type="text"
            placeholder="Nombre de la playa"
            value={form.name}
            onChange={e => handleChange('name', e.target.value)}
            required
            className="flex-grow rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-base bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Location Picker */}
        <div>
          <label className="min-w-[6rem] text-base font-medium mb-1 block" htmlFor="location-picker">
            Ubicación (arrastra o haz click en el mapa)
          </label>
          <LocationPicker location={form.location} onLocationChange={handleLocationChange} />
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Dirección: <span className="font-medium">{form.location.address || 'No seleccionada'}</span>
          </p>
        </div>

        {/* Capacidad total */}
        <div className="flex items-center space-x-3">
          <FiHash className="text-gray-500 dark:text-gray-400 w-5 h-5" />
          <label htmlFor="totalSpots" className="min-w-[6rem] text-base font-medium">Capacidad</label>
          <input
            id="totalSpots"
            type="number"
            placeholder="0"
            min={0}
            value={form.totalSpots}
            onChange={e => handleChange('totalSpots', Number(e.target.value))}
            required
            className="flex-grow rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-base bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Espacios disponibles */}
        <div className="flex items-center space-x-3">
          <FiHash className="text-gray-500 dark:text-gray-400 w-5 h-5" />
          <label htmlFor="availableSpots" className="min-w-[6rem] text-base font-medium">Disponibles</label>
          <input
            id="availableSpots"
            type="number"
            placeholder="0"
            min={0}
            value={form.availableSpots}
            onChange={e => handleChange('availableSpots', Number(e.target.value))}
            required
            className="flex-grow rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-base bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Precio por hora */}
        <div className="flex items-center space-x-3">
          <FiDollarSign className="text-gray-500 dark:text-gray-400 w-5 h-5" />
          <label htmlFor="pricePerHour" className="min-w-[6rem] text-base font-medium">Precio /h</label>
          <input
            id="pricePerHour"
            type="number"
            placeholder="Ej: 100.00"
            step="0.01"
            min={0}
            value={form.pricePerHour}
            onChange={e => handleChange('pricePerHour', Number(e.target.value))}
            required
            className="flex-grow rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-base bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Horario apertura */}
        <div className="flex items-center space-x-3">
          <FiClock className="text-gray-500 dark:text-gray-400 w-5 h-5" />
          <label htmlFor="open" className="min-w-[6rem] text-base font-medium">Apertura</label>
          <input
            id="open"
            type="time"
            value={form.schedule.open}
            onChange={e => handleChange('schedule.open', e.target.value)}
            required
            className="flex-grow rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-base bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Horario cierre */}
        <div className="flex items-center space-x-3">
          <FiClock className="text-gray-500 dark:text-gray-400 w-5 h-5" />
          <label htmlFor="close" className="min-w-[6rem] text-base font-medium">Cierre</label>
          <input
            id="close"
            type="time"
            value={form.schedule.close}
            onChange={e => handleChange('schedule.close', e.target.value)}
            required
            className="flex-grow rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-base bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Owner (readonly) */}
        <div className="flex items-center space-x-3">
          <FiUser className="text-gray-500 dark:text-gray-400 w-5 h-5" />
          <label htmlFor="owner" className="min-w-[6rem] text-base font-medium">ID</label>
          <input
            id="owner"
            type="text"
            value={form.owner}
            readOnly
            className="flex-grow rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-base bg-gray-200 dark:bg-gray-700 cursor-not-allowed select-all"
            title="ID del dueño (no editable)"
          />
        </div>
      </div>

      {/* Botón submit */}
      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full bg-green-600 disabled:bg-green-400 text-white py-3 rounded font-semibold text-lg hover:bg-green-700 transition-colors"
        aria-live="polite"
      >
        {loading ? 'Enviando...' : 'Registrar Playa'}
      </button>

      {/* Mensajes */}
      {error && <p className="text-red-500 text-center mt-3 text-sm">{error}</p>}

      {response && (
        <div className="text-green-600 text-center mt-3 space-y-1 text-sm">
          <p>✅ {response.message}</p>
          {response.parkingLot && (
            <>
              <p><strong>Nombre:</strong> {response.parkingLot.name}</p>
              <p><strong>Dirección:</strong> {response.parkingLot.location?.address}</p>
              <p><strong>Capacidad:</strong> {response.parkingLot.totalSpots}</p>
            </>
          )}
        </div>
      )}
    </form>
  );
}
