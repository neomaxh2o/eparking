'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Tab } from '@headlessui/react';
import { FaEdit, FaList } from 'react-icons/fa';
import type { Tarifa } from '@/interfaces/tarifa';
import AdminTarifas from '@/app/components/AdminPanel/Tarifas/AdminTarifas/AdminTarifas';
import { TarifasList } from '@/app/components/AdminPanel/Tarifas/TarifasList';
import { useTarifas } from '@/app/hooks/Parking/useTarifas';
import { useParkingLots } from '@/modules/parking/hooks/useParkingLots';

interface TarifasAdminPageProps {
  userRole: 'owner' | 'client' | 'guest' | 'operator' | 'admin';
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function TarifasAdminPage({ userRole }: TarifasAdminPageProps) {
  const { tarifas, fetchTarifas, loading, error, updateTarifa, deleteTarifa } = useTarifas();
  const { parkings } = useParkingLots();
  const [tarifaSeleccionada, setTarifaSeleccionada] = useState<Tarifa | null>(null);

  useEffect(() => {
    fetchTarifas();
  }, [fetchTarifas]);

  const tarifaSeleccionadaNormalizada = useMemo(() => {
    if (!tarifaSeleccionada) return null;
    const parentId = (tarifaSeleccionada as any).parentId ?? tarifaSeleccionada._id;
    return tarifas.find((t) => String(t._id) === String(parentId)) ?? tarifaSeleccionada;
  }, [tarifaSeleccionada, tarifas]);

  const handleEditar = (tarifa: Tarifa) => setTarifaSeleccionada(tarifa);
  const handleCancelar = () => setTarifaSeleccionada(null);

  const handleGuardar = async (tarifa: Tarifa) => {
    try {
      if (tarifa._id) await updateTarifa(tarifa._id, tarifa);
      else alert('Crear tarifa aún no implementado');
      setTarifaSeleccionada(null);
      await fetchTarifas();
      alert('Tarifa guardada correctamente');
    } catch {
      alert('Error al guardar la tarifa');
    }
  };

  const handleEliminar = async (tarifa: Tarifa) => {
    const parentId = (tarifa as any).parentId ?? tarifa._id;
    const subId = tarifa._id;
    const tipo = tarifa.tipoEstadia === 'hora' ? 'tarifasHora'
      : tarifa.tipoEstadia === 'dia' ? 'tarifasPorDia'
      : tarifa.tipoEstadia === 'mensual' ? 'tarifaMensual'
      : 'tarifaLibre';
    if (!parentId || !subId) return;
    if (!confirm('¿Seguro querés eliminar esta tarifa?')) return;
    try {
      await deleteTarifa(String(parentId), String(subId), tipo);
      await fetchTarifas();
      alert('Tarifa eliminada correctamente');
      if (tarifaSeleccionada?._id === tarifa._id || tarifaSeleccionada?._id === parentId) setTarifaSeleccionada(null);
    } catch {
      alert('Error al eliminar la tarifa');
    }
  };

  const handleReservar = (tarifa: Tarifa) => {
    alert(`Reservar tarifa: ${tarifa.category} - implementar lógica`);
  };

  const rolParaTarifas: 'owner' | 'client' = userRole === 'owner' || userRole === 'client' ? userRole : 'client';

  return (
    <div className="space-y-6">
      <div className="dashboard-section p-5 md:p-6">
        <h1 className="text-2xl font-bold text-gray-900">Administración de Tarifas</h1>
        <p className="mt-1 text-sm text-gray-500">Gestión tarifaria unificada para categorías, subtarifas y estructura comercial.</p>
      </div>

      <div className="dashboard-section p-5 md:p-6">
        <Tab.Group>
          <Tab.List className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
            <Tab className={({ selected }) => classNames('inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition', selected ? 'border-gray-300 bg-gray-200 text-gray-800' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50')}>
              <FaEdit /> {tarifaSeleccionada ? 'Editar Tarifa' : 'Crear Tarifa'}
            </Tab>
            <Tab className={({ selected }) => classNames('inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition', selected ? 'border-gray-300 bg-gray-200 text-gray-800' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50')}>
              <FaList /> Lista de Tarifas
            </Tab>
          </Tab.List>

          <Tab.Panels className="mt-6">
            <Tab.Panel>
              <AdminTarifas tarifaParaEditar={tarifaSeleccionadaNormalizada} onCancelar={handleCancelar} onGuardar={handleGuardar} />
            </Tab.Panel>
            <Tab.Panel>
              {loading ? <p className="text-sm text-gray-500">Cargando tarifas...</p> : null}
              {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
              <TarifasList tarifas={tarifas} parkings={parkings ?? []} userRole={rolParaTarifas} onSelectTarifa={handleEditar} onEliminar={handleEliminar} onReservar={handleReservar} />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
}
