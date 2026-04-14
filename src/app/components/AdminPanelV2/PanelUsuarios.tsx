'use client';

import React from 'react';
import { Tab } from '@headlessui/react';
import { FaPlus, FaList, FaUserPlus } from 'react-icons/fa';
import UserList from '@/app/components/Users/UserList';
import RegisterOperatorForm from '@/app/components/Users/Register/RegisterOperatorForm';
import RegisterClientForm from '@/app/components/Users/Register/RegisterClientForm';
import { useSession } from 'next-auth/react';
import { useClientsNavigation } from '@/app/components/AdminPanel/ClientsNavigationContext';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function PanelUsuarios() {
  const { data: session, status } = useSession();
  const clientsNavigation = useClientsNavigation();

  if (status === 'loading') return <p className="text-sm text-gray-500">Cargando...</p>;
  if (!session?.user?.id) return <p className="text-sm text-red-600">No estás autenticado</p>;

  return (
    <div className="space-y-6">
      <div className="dashboard-section p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Panel de Usuarios</h1>
            <p className="mt-1 text-sm text-gray-500">Administración de operadores, clientes y visualización general de usuarios.</p>
          </div>
          {clientsNavigation ? (
            <button
              onClick={() => clientsNavigation.goToAbonados()}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Ir a Abonados
            </button>
          ) : null}
        </div>
      </div>

      <div className="dashboard-section p-5 md:p-6">
        <Tab.Group>
          <Tab.List className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
            <Tab className={({ selected }) => classNames('inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition', selected ? 'border-gray-300 bg-gray-200 text-gray-800' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50')}>
              <FaPlus /> Registrar Operador
            </Tab>
            <Tab className={({ selected }) => classNames('inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition', selected ? 'border-gray-300 bg-gray-200 text-gray-800' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50')}>
              <FaUserPlus /> Registrar Cliente
            </Tab>
            <Tab className={({ selected }) => classNames('inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition', selected ? 'border-gray-300 bg-gray-200 text-gray-800' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50')}>
              <FaList /> Lista de Usuarios
            </Tab>
          </Tab.List>

          <Tab.Panels className="mt-6">
            <Tab.Panel><RegisterOperatorForm /></Tab.Panel>
            <Tab.Panel><RegisterClientForm /></Tab.Panel>
            <Tab.Panel><UserList currentUserId={session.user.id} /></Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
}
