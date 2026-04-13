/**
 * @deprecated Use `@/modules/parking/hooks/useParkings` directly when compatibility helpers
 * like owner filtering / local availability toggling are not required.
 * Compatibility layer kept temporarily during consumer migration.
 */
import { useState, useEffect } from 'react';
import { fetchParkings, updateParkingAvailability } from '@/modules/parking/lib';
import type { ParkingDto } from '@/shared/api/contracts/parking';

export interface Parking extends ParkingDto {
  _id: string;
}

export default function useParkings(ownerId?: string) {
  const [parkings, setParkings] = useState<Parking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadParkings() {
      setLoading(true);
      setError(null);

      try {
        const allParkings = await fetchParkings();
        const normalized: Parking[] = allParkings.map((parking) => ({
          ...parking,
          _id: String(parking._id ?? parking.id),
        }));

        const filtered = ownerId
          ? normalized.filter((parking) => String(parking.owner ?? '') === String(ownerId))
          : normalized;

        setParkings(filtered);
      } catch (err: any) {
        setError(err.message || 'Error inesperado');
      } finally {
        setLoading(false);
      }
    }

    loadParkings();
  }, [ownerId]);

  const toggleAvailability = async (id: string, current: boolean) => {
    setParkings((prev) =>
      prev.map((parking) =>
        parking._id === id ? { ...parking, isAvailable: !current } : parking
      )
    );

    try {
      await updateParkingAvailability(id, !current);
    } catch (error) {
      console.error(error);
      setError('No se pudo actualizar la disponibilidad.');
      setParkings((prev) =>
        prev.map((parking) =>
          parking._id === id ? { ...parking, isAvailable: current } : parking
        )
      );
    }
  };

  return { parkings, loading, error, toggleAvailability };
}
