'use client';

import React from 'react';
import { Tab } from '@headlessui/react';
import { FaPlus, FaList } from 'react-icons/fa';
import ReservationList from '@/app/components/Reservations/ReservationList';
import ReservationCreateForm from '@/app/components/AdminPanel/AdminReservations/ReservationCreateForm';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function PanelReservas() {
  return (
    <div className="space-y-6">
      <div className="dashboard-section p-5 md:p-6">
        <h1 className="text-2xl font-bold text-gray-900">Panel de Reservas</h1>
        <p className="mt-1 text-sm text-gray-500">Alta, seguimiento y administración centralizada de reservas.</p>
      </div>

      <div className="dashboard-section p-5 md:p-6">
        <Tab.Group>
          <Tab.List className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
            <Tab className={({ selected }) => classNames('inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition', selected ? 'border-gray-300 bg-gray-200 text-gray-800' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50')}>
              <FaPlus /> Crear Reserva
            </Tab>
            <Tab className={({ selected }) => classNames('inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition', selected ? 'border-gray-300 bg-gray-200 text-gray-800' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50')}>
              <FaList /> Lista de Reservas
            </Tab>
          </Tab.List>

          <Tab.Panels className="mt-6">
            <Tab.Panel><ReservationCreateForm /></Tab.Panel>
            <Tab.Panel><ReservationList /></Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
}
