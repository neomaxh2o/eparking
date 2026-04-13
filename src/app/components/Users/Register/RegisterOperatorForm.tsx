'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRegisterUser } from '@/app/hooks/Users/useRegisterUser';
import { useParkingLots } from '@/modules/parking/hooks/useParkingLots';
import { User, Mail, Lock, MapPin, CheckCircle, XCircle } from 'lucide-react';

interface LocalRegisterFormData {
  name: string;
  email: string;
  password: string;
  role: 'operator';
  assignedParking: string;
}

export default function RegisterOperatorForm() {
  const { register, loading, error, response } = useRegisterUser();
  const { parkings, loading: loadingParkings, error: errorParkings } = useParkingLots();

  const parkingOptions = useMemo(() => {
    return (
      parkings?.map((p: any, index: number) => {
        let id = '';

        if (typeof p._id === 'string' && p._id.trim()) {
          id = p._id.trim();
        } else if (p._id?.$oid && typeof p._id.$oid === 'string') {
          id = p._id.$oid.trim();
        } else if (p._id && typeof p._id.toString === 'function') {
          const value = p._id.toString();
          if (value && value !== '[object Object]') id = value;
        } else if (typeof p.id === 'string' && p.id.trim()) {
          id = p.id.trim();
        }

        return {
          id,
          name: p.name || `Parking ${index + 1}`,
        };
      }) ?? []
    );
  }, [parkings]);

  const [formData, setFormData] = useState<LocalRegisterFormData>({
    name: '',
    email: '',
    password: '',
    role: 'operator',
    assignedParking: '',
  });

  const [valid, setValid] = useState({
    email: true,
    password: true,
    assignedParking: true,
  });

  useEffect(() => {
    setValid({
      email: formData.email === '' || /^\S+@\S+\.\S+$/.test(formData.email),
      password: formData.password === '' || formData.password.length >= 6,
      assignedParking: formData.assignedParking !== '',
    });
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid.email || !valid.password || !valid.assignedParking) return;
    await register(formData);
  };

  return (
    <div className="dashboard-section mx-auto max-w-2xl p-5 md:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Registrar Operador</h2>
        <p className="mt-1 text-sm text-gray-500">
          Alta de operadores con asignación directa a una playa.
        </p>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {response?.success ? (
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          <CheckCircle className="h-4 w-4" /> {response.message}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-300 bg-white px-4 py-3 focus-within:border-gray-500">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">Nombre completo</label>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full border-0 bg-transparent outline-none" />
            </div>
          </div>

          <div className={`rounded-2xl border bg-white px-4 py-3 ${!valid.email ? 'border-red-400' : 'border-gray-300'} focus-within:border-gray-500`}>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">Correo</label>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full border-0 bg-transparent outline-none" />
              {!valid.email ? <XCircle className="h-4 w-4 text-red-500" /> : valid.email && formData.email ? <CheckCircle className="h-4 w-4 text-green-500" /> : null}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className={`rounded-2xl border bg-white px-4 py-3 ${!valid.password ? 'border-red-400' : 'border-gray-300'} focus-within:border-gray-500`}>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">Contraseña</label>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-gray-400" />
              <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full border-0 bg-transparent outline-none" />
              {!valid.password ? <XCircle className="h-4 w-4 text-red-500" /> : valid.password && formData.password ? <CheckCircle className="h-4 w-4 text-green-500" /> : null}
            </div>
          </div>

          <div className={`rounded-2xl border bg-white px-4 py-3 ${!valid.assignedParking ? 'border-red-400' : 'border-gray-300'} focus-within:border-gray-500`}>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">Playa asignada</label>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              {loadingParkings ? (
                <p className="text-sm text-gray-500">Cargando playas...</p>
              ) : errorParkings ? (
                <p className="text-sm text-red-500">Error al cargar playas</p>
              ) : (
                <select name="assignedParking" value={formData.assignedParking} onChange={handleChange} required className="w-full border-0 bg-transparent outline-none">
                  <option value="">Selecciona una playa</option>
                  {parkingOptions.filter((p) => p.id && p.id.length > 0).map((p, index) => (
                    <option key={`${p.id}-${index}`} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}
              {valid.assignedParking && formData.assignedParking ? <CheckCircle className="h-4 w-4 text-green-500" /> : null}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !valid.email || !valid.password || !valid.assignedParking}
          className={`w-full rounded-xl bg-gray-900 py-3 font-semibold text-white transition hover:bg-black ${loading ? 'cursor-not-allowed opacity-70' : ''}`}
        >
          {loading ? 'Registrando...' : 'Registrar Operador'}
        </button>
      </form>
    </div>
  );
}
