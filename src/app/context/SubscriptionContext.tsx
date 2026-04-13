'use client';

import React, { createContext, useContext, ReactNode, useCallback, useState } from 'react';
import { useUsers } from '@/app/hooks/Users/useUsers';
import { useParkingLots } from '@/modules/parking/hooks/useParkingLots';
import { useTarifas } from '@/app/hooks/Tarifa/useTarifa';
import { usePlazas } from '@/app/hooks/Estadias/usePlazas';
import { useUserSession } from '@/app/hooks/Users/useUserSession';
import { User } from '@/interfaces/user';
import { ParkingLotContext } from '@/interfaces/Parking/ParkingLot';
import { ITarifa } from '@/interfaces/Tarifa/tarifa';
import { ISubscription } from '@/interfaces/Abono/subscription';

interface SubscriptionContextProps {
  users: User[];
  parkings: ParkingLotContext[];
  tarifas: ITarifa[];
  subscriptions: ISubscription[];
  plazas: any[];
  currentUser: User | null;
  loadingUsers: boolean;
  loadingParkings: boolean;
  loadingTarifas: boolean;
  loadingSubscriptions: boolean;
  loadingPlazas: boolean;
  errorUsers: string | null;
  errorParkings: string | null;
  errorTarifas: string | null;
  errorSubscriptions: string | null;
  errorPlazas: string | null;
  refetchUsers: () => void;
  refetchParkings: () => void;
  refetchTarifas: () => void;
  fetchSubscriptions: (userId?: string) => Promise<void>;
  createSubscription: (data: Partial<ISubscription>) => Promise<ISubscription | null>;
  updateSubscription: (id: string, data: Partial<ISubscription>) => Promise<ISubscription | null>;
  deleteSubscription: (id: string) => Promise<boolean>;
  fetchPlazas: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextProps | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { users, loading: loadingUsers, error: errorUsers } = useUsers();
  const { parkings, loading: loadingParkings, error: errorParkings } = useParkingLots();
  const { tarifas, loading: loadingTarifas, error: errorTarifas, fetchTarifas } = useTarifas();
  const { plazas, loading: loadingPlazas, error: errorPlazas, fetchPlazas } = usePlazas();

  const { currentUser } = useUserSession();

  const [subscriptions, setSubscriptions] = useState<ISubscription[]>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [errorSubscriptions, setErrorSubscriptions] = useState<string | null>(null);

  // --- FETCH SUSCRIPCIONES ---
  const fetchSubscriptions = useCallback(async (userId?: string) => {
    setLoadingSubscriptions(true);
    setErrorSubscriptions(null);
    try {
      let url = '/api/subscriptions';
      if (userId) url += `?userId=${userId}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error fetching subscriptions');
      setSubscriptions(data);
    } catch (err: any) {
      setErrorSubscriptions(err.message);
    } finally {
      setLoadingSubscriptions(false);
    }
  }, []);

  // --- CREATE SUSCRIPCIÓN ---
  const createSubscription = useCallback(
    async (data: Partial<ISubscription>) => {
      if (!currentUser) {
        setErrorSubscriptions('No hay usuario logueado');
        return null;
      }

      setLoadingSubscriptions(true);
      setErrorSubscriptions(null);

      try {
        const assignedParkingId =
          typeof data.assignedParking === 'string'
            ? data.assignedParking
            : (data.assignedParking as any)?._id;

        const tarifaMensualDoc = tarifas.find(
          t =>
            t.parkinglotId === assignedParkingId &&
            t.category === data.categoriaVehiculo &&
            t.tarifaMensual &&
            t.tarifaMensual.length > 0
        );

        if (!tarifaMensualDoc) throw new Error('No se encontró tarifa mensual');

        const payload: Partial<ISubscription> = {
          ...data,
          assignedParking: assignedParkingId,
          tipoAbono: 'mensual',
          operadorId: currentUser._id, // 🔹 operador logueado
          tarifaId: tarifaMensualDoc._id,
        };

        const res = await fetch('/api/subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const newSub: ISubscription & { error?: string } = await res.json();
        if (!res.ok) throw new Error(newSub.error || 'Error creando suscripción');

        setSubscriptions(prev => [...prev, newSub]);
        return newSub;
      } catch (err: any) {
        setErrorSubscriptions(err.message);
        return null;
      } finally {
        setLoadingSubscriptions(false);
      }
    },
    [tarifas, currentUser]
  );

  // --- UPDATE SUSCRIPCIÓN ---
  const updateSubscription = useCallback(async (id: string, data: Partial<ISubscription>) => {
    setLoadingSubscriptions(true);
    setErrorSubscriptions(null);
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || 'Error updating subscription');
      setSubscriptions(prev => prev.map(sub => (sub._id === id ? updated : sub)));
      return updated;
    } catch (err: any) {
      setErrorSubscriptions(err.message);
      return null;
    } finally {
      setLoadingSubscriptions(false);
    }
  }, []);

  // --- DELETE SUSCRIPCIÓN ---
  const deleteSubscription = useCallback(async (id: string) => {
    setLoadingSubscriptions(true);
    setErrorSubscriptions(null);
    try {
      const res = await fetch(`/api/subscriptions?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error deleting subscription');
      setSubscriptions(prev => prev.filter(sub => sub._id !== id));
      return true;
    } catch (err: any) {
      setErrorSubscriptions(err.message);
      return false;
    } finally {
      setLoadingSubscriptions(false);
    }
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        users,
        parkings: parkings || [],
        tarifas,
        subscriptions,
        plazas,
        loadingUsers,
        loadingParkings,
        loadingTarifas,
        loadingSubscriptions,
        loadingPlazas,
        errorUsers,
        errorParkings,
        errorTarifas,
        errorSubscriptions,
        errorPlazas,
        currentUser, // 🔹 operador logueado
        refetchUsers: () => window.location.reload(),
        refetchParkings: () => window.location.reload(),
        refetchTarifas: fetchTarifas,
        fetchSubscriptions,
        createSubscription,
        updateSubscription,
        deleteSubscription,
        fetchPlazas,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscriptionContext = () => {
  const context = useContext(SubscriptionContext);
  if (!context) throw new Error('useSubscriptionContext debe usarse dentro de SubscriptionProvider');
  return context;
};
