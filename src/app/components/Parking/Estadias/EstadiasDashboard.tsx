'use client';

import React, { useMemo } from 'react';
import { useSession } from 'next-auth/react';
import IngresoEstadia from '@/app/components/Parking/Estadias/IngresoEstadia';
import { useTurno } from '@/app/hooks/Parking/Caja/useTurno';

interface EstadiasDashboardProps {
  nombreEstacionamiento?: string;
}

export default function EstadiasDashboard({ nombreEstacionamiento = 'Estacionamiento' }: EstadiasDashboardProps) {
  const { data: session } = useSession();
  const operatorId = session?.user?.id ?? '';
  const { turno, loading, error } = useTurno(operatorId);

  const resumenTickets = useMemo(() => {
    const tickets = turno?.tickets || [];

    const porHora = tickets.filter((t) => t.tipoEstadia === 'hora').length;
    const porDia = tickets.filter((t) => t.tipoEstadia === 'dia').length;
    const libre = tickets.filter((t) => t.tipoEstadia === 'libre').length;
    const activos = tickets.filter((t) => t.estado === 'activa').length;
    const cerrados = tickets.filter((t) => t.estado === 'cerrada').length;

    const montoHora = tickets.filter((t) => t.tipoEstadia === 'hora').reduce((sum, t) => sum + (t.totalCobrado ?? 0), 0);
    const montoDia = tickets.filter((t) => t.tipoEstadia === 'dia').reduce((sum, t) => sum + (t.totalCobrado ?? 0), 0);
    const montoLibre = tickets.filter((t) => t.tipoEstadia === 'libre').reduce((sum, t) => sum + (t.totalCobrado ?? 0), 0);

    return {
      total: tickets.length,
      porHora,
      porDia,
      libre,
      activos,
      cerrados,
      montoHora,
      montoDia,
      montoLibre,
    };
  }, [turno?.tickets]);

  if (!operatorId) {
    return (
      <section className="dashboard-section border-red-200 bg-red-50 p-6">
        <h2 className="text-xl font-bold text-red-700">Operador no autenticado</h2>
        <p className="mt-2 text-sm text-red-600">Debés iniciar sesión para ingresar al módulo de estadías.</p>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="dashboard-section p-6">
        <h2 className="text-xl font-bold text-gray-900">Estadías</h2>
        <p className="mt-2 text-sm text-gray-500">Verificando turno activo...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="dashboard-section border-red-200 bg-red-50 p-6">
        <h2 className="text-xl font-bold text-red-700">No se pudo validar el turno</h2>
        <p className="mt-2 text-sm text-red-600">{error}</p>
      </section>
    );
  }

  if (!turno || turno.estado !== 'abierto') {
    return (
      <section className="dashboard-section p-8 md:p-10">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
            Estadías bloqueado
          </div>

          <h1 className="mt-4 text-2xl font-bold text-gray-900">No hay un turno abierto</h1>
          <p className="mt-3 text-sm text-gray-500">Para ingresar al módulo de estadías primero tenés que abrir un turno de caja.</p>

          <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-left">
            <p className="text-sm font-semibold text-gray-800">Estacionamiento</p>
            <p className="mt-1 text-sm text-gray-600">{nombreEstacionamiento}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="dashboard-section p-5 md:p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Resumen de tickets</h3>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Tickets por hora</p>
            <p className="text-2xl font-bold text-gray-900">{resumenTickets.porHora}</p>
            <p className="mt-1 text-sm text-gray-500">Monto: ${resumenTickets.montoHora.toFixed(2)}</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Tickets por día</p>
            <p className="text-2xl font-bold text-gray-900">{resumenTickets.porDia}</p>
            <p className="mt-1 text-sm text-gray-500">Monto: ${resumenTickets.montoDia.toFixed(2)}</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Estadía libre</p>
            <p className="text-2xl font-bold text-gray-900">{resumenTickets.libre}</p>
            <p className="mt-1 text-sm text-gray-500">Monto: ${resumenTickets.montoLibre.toFixed(2)}</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Tickets activos</p>
            <p className="text-2xl font-bold text-blue-700">{resumenTickets.activos}</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Tickets cerrados</p>
            <p className="text-2xl font-bold text-green-700">{resumenTickets.cerrados}</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Total tickets</p>
            <p className="text-2xl font-bold text-gray-900">{resumenTickets.total}</p>
          </div>
        </div>
      </section>

      <IngresoEstadia />
    </div>
  );
}
