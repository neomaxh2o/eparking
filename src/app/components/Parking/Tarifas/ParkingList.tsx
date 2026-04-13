'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParkings as useParkingsModule } from '@/modules/parking/hooks/useParkings';
import TarifasParkingCard from './TarifasParkingCard';
import { formatAddress } from '@/utils/addressFormatter';
import { AnimatePresence, motion } from 'framer-motion'; // para animaciones

interface ParkingListProps {
  ownerId?: string;
  currentUserId?: string;
  userRole: 'operator' | 'client' | 'owner' | 'admin' | 'guest';
}

export default function ParkingList({ ownerId, currentUserId, userRole }: ParkingListProps) {
  const { parkings, loading, error } = useParkingsModule();
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [showRatesFor, setShowRatesFor] = useState<string | null>(null);

  useEffect(() => {
    if (parkings.length > 0) {
      const availabilityFromData: Record<string, boolean> = {};
      parkings.forEach((p) => {
        availabilityFromData[p._id] = p.isAvailable ?? (p.availableSpots > 0);
      });
      setAvailability(availabilityFromData);
    }
  }, [parkings]);

  const toggleAvailability = async (id: string) => {
    const current = availability[id];
    setAvailability((prev) => ({ ...prev, [id]: !current }));

    try {
      const res = await fetch(`/api/parking/update-availability`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isAvailable: !current }),
      });
      if (!res.ok) {
        setAvailability((prev) => ({ ...prev, [id]: current }));
        const errData = await res.json();
        alert('Error al actualizar disponibilidad: ' + (errData.error || res.statusText));
      }
    } catch {
      setAvailability((prev) => ({ ...prev, [id]: current }));
      alert('Error de conexión con el servidor');
    }
  };

  const filteredParkings = useMemo(() => {
    if (!ownerId) return parkings;
    return parkings.filter((p) => {
      if (typeof p.owner === 'string') return p.owner === ownerId;
      if (typeof p.owner === 'object' && p.owner?._id) return String(p.owner._id) === String(ownerId);
      return false;
    });
  }, [parkings, ownerId]);

  if (loading) return <p className="text-center text-gray-700">Cargando playas...</p>;
  if (error) return <p className="text-center text-red-600 font-semibold">{error}</p>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {filteredParkings.length === 0 && (
        <p className="text-center text-gray-600 italic">No hay playas registradas.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredParkings.map((p) => {
          const isAvailable = availability[p._id] ?? false;
          const isOwner =
            userRole === 'owner' &&
            currentUserId &&
            ((typeof p.owner === 'string' && p.owner === currentUserId) ||
              (typeof p.owner === 'object' && String(p.owner?._id) === String(currentUserId)));

          return (
            <motion.div
              key={p._id}
              className="bg-white rounded-xl shadow-lg p-6 flex flex-col justify-between border border-gray-200 hover:shadow-2xl transition-shadow"
              whileHover={{ scale: 1.03 }}
            >
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-gray-800">{p.name}</h3>

                <div className="flex items-center gap-2 text-blue-600 hover:underline cursor-pointer">
                  <LocationIcon />
                  <a
                    href={`https://www.google.com/maps?q=${p.location.lat},${p.location.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {formatAddress(p.location.address) || 'Ubicación no disponible'}
                  </a>
                </div>

                <div className="flex flex-wrap gap-4 text-gray-700 mt-2">
                  <InfoBadge icon={<CapacityIcon />} label={`Capacidad: ${p.totalSpots}`} />
                  <InfoBadge icon={<AvailableIcon />} label={`Disponibles: ${p.availableSpots}`} />
                  <InfoBadge icon={<PriceIcon />} label={`Precio: $${p.pricePerHour.toFixed(2)}/hr`} />
                  <InfoBadge icon={<ScheduleIcon />} label={`Horario: ${p.schedule.open} - ${p.schedule.close}`} />
                </div>

                <p className="mt-2 text-gray-700">
                  <strong>Dueño:</strong>{' '}
                  {typeof p.owner === 'string' ? p.owner : p.owner?.name || p.owner?._id || 'Desconocido'}
                </p>
              </div>

              <div className="flex flex-col gap-3 mt-4">
                <button
                  onClick={() => isOwner && toggleAvailability(p._id)}
                  disabled={!isOwner}
                  className={`py-2 rounded font-semibold text-white transition-colors ${
                    isAvailable ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                  } ${!isOwner ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={isOwner ? '' : 'Solo el dueño puede cambiar disponibilidad'}
                >
                  {isAvailable ? 'Hay lugar' : 'No hay lugar'}
                </button>

                <button
                  onClick={() => setShowRatesFor(p._id)}
                  className="py-2 rounded border border-purple-600 text-purple-600 font-semibold hover:bg-purple-50 transition"
                >
                  Mostrar tarifas
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Modal con animación */}
      <AnimatePresence>
        {showRatesFor && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <TarifasParkingCard
              parking={parkings.find((p) => p._id === showRatesFor)!}
              onClose={() => setShowRatesFor(null)}
              userRole={userRole}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// === Helpers ===
function InfoBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-sm">
      {icon} <span>{label}</span>
    </div>
  );
}

// === ICONS ===
function LocationIcon() { return <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 11c1.104 0 2-.896 2-2 0-1.104-.896-2-2-2s-2 .896-2 2c0 1.104.896 2 2 2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 21s8-4.5 8-10a8 8 0 10-16 0c0 5.5 8 10 8 10z" /></svg>; }
function CapacityIcon() { return <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v4a1 1 0 001 1h3" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 7v4a1 1 0 01-1 1h-3" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 7a3 3 0 013-3h12a3 3 0 013 3v4a1 1 0 01-1 1h-3m-7 5v2m4-2v2m-6 2h6" /></svg>; }
function AvailableIcon() { return <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8 12l3 3 5-5" /></svg>; }
function PriceIcon() { return <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 1v22m0-10h6a6 6 0 01-6 6" /><circle cx="12" cy="12" r="9" /></svg>; }
function ScheduleIcon() { return <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /></svg>; }
