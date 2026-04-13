import { useMemo } from 'react';
import { useParkings } from '@/modules/parking/hooks/useParkings';
import type { ParkingLotContext } from '@/interfaces/Parking/ParkingLot';

export function useParkingLots() {
  const { parkings, loading, error } = useParkings();

  const parkingLots = useMemo<ParkingLotContext[]>(
    () =>
      parkings.map((parking) => ({
        _id: String(parking._id ?? parking.id),
        owner: String(parking.owner ?? ''),
        name: parking.name,
        location: {
          lat: Number(parking.location?.lat ?? 0),
          lng: Number(parking.location?.lng ?? 0),
          address: String(parking.location?.address ?? ''),
        },
        totalSpots: Number(parking.totalSpots ?? 0),
        availableSpots: Number(parking.availableSpots ?? 0),
        pricePerHour: Number(parking.pricePerHour ?? 0),
        schedule: {
          open: String(parking.schedule?.open ?? ''),
          close: String(parking.schedule?.close ?? ''),
        },
        isAvailable: Boolean(parking.isAvailable ?? true),
      })),
    [parkings]
  );

  return { parkings: parkingLots, loading, error };
}
