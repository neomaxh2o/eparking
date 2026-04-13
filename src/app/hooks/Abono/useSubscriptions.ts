'use client';

import { useState } from 'react';
import { User, ParkingRef, MedioAcceso, TipoAbono, TipoPago } from '@/interfaces/user';
import { Categoria } from '@/interfaces/Estadias/estadias';
import { ISubscription } from '@/interfaces/Abono/subscription';




interface UseSubscriptionsReturn {
  subscriptions: ISubscription[];
  loading: boolean;
  error: string | null;
  fetchSubscriptions: (userId?: string) => Promise<void>;
  createSubscription: (data: Partial<ISubscription>) => Promise<ISubscription | null>;
  updateSubscription: (id: string, data: Partial<ISubscription>) => Promise<ISubscription | null>;
  deleteSubscription: (id: string) => Promise<boolean>;
}

export function useSubscriptions(): UseSubscriptionsReturn {
  const [subscriptions, setSubscriptions] = useState<ISubscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptions = async (userId?: string) => {
    setLoading(true);
    setError(null);
    try {
      let url = '/api/subscriptions';
      if (userId) url += `?userId=${userId}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error fetching subscriptions');
      setSubscriptions(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async (data: Partial<ISubscription>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const newSub = await res.json();
      if (!res.ok) throw new Error(newSub.error || 'Error creating subscription');
      setSubscriptions(prev => [...prev, newSub]);
      return newSub;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateSubscription = async (id: string, data: Partial<ISubscription>) => {
    setLoading(true);
    setError(null);
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
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteSubscription = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/subscriptions?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error deleting subscription');
      setSubscriptions(prev => prev.filter(sub => sub._id !== id));
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    subscriptions,
    loading,
    error,
    fetchSubscriptions,
    createSubscription,
    updateSubscription,
    deleteSubscription,
  };
}
