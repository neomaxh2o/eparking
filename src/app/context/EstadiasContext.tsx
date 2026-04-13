'use client';
import React, { createContext, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useEstadias } from '@/modules/parking-sessions/hooks/useEstadias';
import { useTarifas } from '@/app/hooks/Tarifa/useTarifa';
import type { EstadiasContextType, IEstadia } from '@/interfaces/Estadias/estadias';
import type { ITarifa, Categoria } from '@/interfaces/Tarifa/tarifa';
import { useParkingLots } from '@/app/hooks/Parking/useParkingLots';
import type { ParkingLotContext } from '@/interfaces/Parking/ParkingLot';

// Context
interface ContextIntegrado extends EstadiasContextType {
  tarifas: ITarifa[];
  tarifasLoading: boolean;
  getTarifaByCategory: (categoria: Categoria) => ITarifa | null;
  parkings: ParkingLotContext[] | null;
  parkingsLoading: boolean;
  parkingsError: string | null;
}

const EstadiasContext = createContext<ContextIntegrado | undefined>(undefined);

interface Props {
  children: ReactNode;
}

export const EstadiasProvider = ({ children }: Props) => {
  // Estadías
  const { estadias, refresh: originalRefresh, loading } = useEstadias();

  const refresh = useCallback(async () => {
    await originalRefresh();
  }, [originalRefresh]);

  // Tarifas
  const { tarifas, loading: tarifasLoading, getTarifaByCategory } = useTarifas();

  // Parkings
  const { parkings: rawParkings, loading: parkingsLoading, error: parkingsError } = useParkingLots();

  // Mapear parkings para ajustarlos a la interface ParkingLotContext
const parkings: ParkingLotContext[] | null = rawParkings
  ? (rawParkings as ParkingLotContext[]).map(p => ({
      _id: p._id,
      owner: typeof p.owner === 'string' ? p.owner : (p.owner as any)._id, // si viene poblado, tomar solo id
      name: p.name,
      location: {
        lat: p.location.lat,
        lng: p.location.lng,
        address: p.location.address,
      },
      totalSpots: p.totalSpots,
      availableSpots: p.availableSpots,
      pricePerHour: p.pricePerHour,
      schedule: {
        open: p.schedule.open,
        close: p.schedule.close,
      },
      isAvailable: (p as any).isAvailable ?? true,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }))
  : null;


  // Auto-refresh cada 60 segundos para estadías
  useEffect(() => {
    const interval = setInterval(() => {
      refresh();
    }, 60000);

    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <EstadiasContext.Provider
      value={{
        estadias: estadias as IEstadia[],
        refresh,
        loading,
        tarifas,
        tarifasLoading,
        getTarifaByCategory,
        parkings,
        parkingsLoading,
        parkingsError,
      }}
    >
      {children}
    </EstadiasContext.Provider>
  );
};

export const useEstadiasContext = () => {
  const context = useContext(EstadiasContext);
  if (!context) throw new Error('useEstadiasContext debe usarse dentro de un EstadiasProvider');
  return context;
};
