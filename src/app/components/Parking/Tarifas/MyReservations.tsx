'use client';

import { useEffect, useState } from 'react';

interface Reservation {
  _id: string;
  parkingLot: string; // O el nombre completo si haces populate
  startTime: string;
  endTime: string;
  status?: 'pending' | 'confirmed' | 'canceled' | string;
  amountPaid?: number;
  totalAmount?: number;
}

export default function MyReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Reservation | null>(null);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const res = await fetch('/api/parking/reservations/my');
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Error cargando reservas');

        setReservations(data.reservations || []);
      } catch (err: any) {
        setError(err.message || 'Error inesperado');
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  const closeModal = () => setSelected(null);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12"></div>
        <style jsx>{`
          .loader {
            border-top-color: #6366f1;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) return <p className="text-center text-red-600 font-semibold">{error}</p>;

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Mis Reservas</h2>

      {reservations.length === 0 ? (
        <p className="text-center text-gray-500 italic">No tienes reservas activas.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
          {reservations.map((r) => (
            <li
              key={r._id}
              className="bg-white shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow border border-gray-200 cursor-pointer"
              onClick={() => setSelected(r)}
            >
              <p className="text-gray-700 font-semibold">{r.parkingLot}</p>
              <p className="text-gray-600 text-sm">
                {new Date(r.startTime).toLocaleString()} - {new Date(r.endTime).toLocaleString()}
              </p>
              {r.status && <StatusBadge status={r.status.toLowerCase()} />}
            </li>
          ))}
        </ul>
      )}

      {/* Modal de detalles */}
      {selected && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-2xl font-bold"
              aria-label="Cerrar modal"
            >
              &times;
            </button>

            <h3 className="text-xl font-bold text-gray-800 mb-4">{selected.parkingLot}</h3>

            <div className="grid grid-cols-1 gap-3">
              <p>
                <strong>Inicio:</strong> {new Date(selected.startTime).toLocaleString()}
              </p>
              <p>
                <strong>Fin:</strong> {new Date(selected.endTime).toLocaleString()}
              </p>
              {selected.totalAmount !== undefined && (
                <p>
                  <strong>Total:</strong> ${selected.totalAmount.toFixed(2)}
                </p>
              )}
              {selected.amountPaid !== undefined && (
                <p>
                  <strong>Pagado:</strong> ${selected.amountPaid.toFixed(2)}
                </p>
              )}
              {selected.status && <StatusBadge status={selected.status.toLowerCase()} />}
            </div>

            <div className="mt-6 flex gap-4 flex-wrap">
              {selected.status === 'pending' && (
                <button className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded">
                  Pagar Ahora
                </button>
              )}
              {selected.status === 'confirmed' && (
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded">
                  Ver Factura
                </button>
              )}
              {selected.status !== 'canceled' && (
                <button className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded">
                  Cancelar Reserva
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Badge de estado con colores
function StatusBadge({ status }: { status: string }) {
  let bgColor = 'bg-gray-300 text-gray-800';
  if (status === 'confirmed') bgColor = 'bg-green-200 text-green-800';
  else if (status === 'pending') bgColor = 'bg-yellow-200 text-yellow-800';
  else if (status === 'canceled') bgColor = 'bg-red-200 text-red-800';

  return (
    <span className={`inline-block mt-2 px-2 py-1 rounded text-sm font-semibold ${bgColor}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
