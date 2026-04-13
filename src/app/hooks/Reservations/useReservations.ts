'use client';

import { useState, useEffect } from 'react';

export interface Reservation {
  _id: string;
  user: { _id: string; email: string; name?: string } | string;
  parkingLot: { _id: string; name: string } | string;

  // Datos cliente
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string;
  ciudad: string;

  // Datos vehículo
  patenteVehiculo: string;
  modeloVehiculo: string;
  categoriaVehiculo: 'Automóvil' | 'Camioneta' | 'Bicicleta' | 'Motocicleta' | 'Otros';

  // Otros datos
  domicilio: string;
  formaPago: string;
  cantidadDias: number;

  // Horarios y estado
  startTime: string;
  endTime: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  amountPaid?: number;

  // Nuevo campo: quién procesó la reserva
  processedBy?: string;
}

export function useReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const res = await fetch('/api/parking/reservations/all');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cargar reservas');
      setReservations(data.reservations || []);
    } catch (err: any) {
      setError(err.message || 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const updateReservation = async (
    id: string,
    updates: Partial<Reservation> & { processedBy?: string }
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch(`/api/parking/reservations/${id}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error al actualizar reserva');

      // Actualizar estado local incluyendo processedBy
      setReservations(prev =>
        prev.map(r =>
          r._id === id
            ? { ...r, ...updates, processedBy: updates.processedBy || r.processedBy }
            : r
        )
      );

      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const createReservation = async (
    newReservation: Omit<Reservation, '_id' | 'status' | 'processedBy'>
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch(`/api/parking/reservations/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newReservation),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear reserva');

      setReservations(prev => [...prev, data.reservation]);

      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  return {
    reservations,
    loading,
    error,
    updateReservation,
    createReservation,
    refetch: fetchReservations,
  };
}
