'use client';

import React, { useState } from 'react';
import { Reservation } from '@/interfaces/reservations';

interface PaymentCheckInProps {
  reservation: Reservation;
  onPaymentUpdated: (updatedReservation: Reservation) => void;
}

export default function PaymentCheckIn({ reservation, onPaymentUpdated }: PaymentCheckInProps) {
  const [amount, setAmount] = useState(reservation.amountPaid ?? 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/reservations/${reservation._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amountPaid: amount }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al actualizar pago');
      } else {
        setSuccessMsg('Pago acreditado con éxito');
        onPaymentUpdated(data.reservation);
      }
    } catch (err) {
      setError('Error de red, intenta nuevamente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border p-3 rounded bg-yellow-50">
      <h3 className="font-semibold mb-2">Acreditar pago</h3>
      <label className="block mb-1">
        Monto pagado:
        <input
          type="number"
          min={0}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="border rounded px-2 py-1 ml-2 w-24"
          disabled={loading}
        />
      </label>
      <button
        onClick={handleSubmit}
        disabled={loading || amount < 0}
        className="mt-2 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? 'Guardando...' : 'Registrar Pago'}
      </button>
      {error && <p className="text-red-600 mt-2">{error}</p>}
      {successMsg && <p className="text-green-600 mt-2">{successMsg}</p>}
    </div>
  );
}
