'use client';
import React, { useEffect, useState } from 'react';
import { useEstadiasContext } from '@/app/context/EstadiasContext';
import EstadiaCard from './UI/EstadiaCard';
import { useEstadiasEnTiempoReal } from '@/modules/parking-sessions/hooks/useEstadiasEnTiempoReal';
import EstadiasMensuales from './EstadiasMensuales'; // ✅ importamos el componente de estadías mensuales

const EstadiasActivas: React.FC = () => {
  const { estadias, refresh, getTarifaByCategory } = useEstadiasContext();
  const [tab, setTab] = useState<'activa' | 'cerrada' | 'prepago' | 'mensual'>('activa'); // ✅ agregamos 'mensual'

  // Filtramos según el tipo de tab
  const estadiasFiltradas = tab === 'mensual'
    ? estadias.filter(e => e.tipoEstadia === 'mensual')
    : estadias;

  const estadiasEnTiempoReal = useEstadiasEnTiempoReal(
    estadiasFiltradas,
    tab === 'mensual' ? 'activa' : tab, // para las mensuales, manejamos solo estado 'activa'
    getTarifaByCategory
  );

  useEffect(() => {
    if (!refresh) return;
    const intervalRefresh = setInterval(() => refresh(), 180000);
    return () => clearInterval(intervalRefresh);
  }, [refresh]);

  if (!estadias) return null;

  return (
    <section className="p-4 bg-gray-50 min-h-screen">
      <h3 className="text-2xl font-semibold mb-4 text-gray-800">Estadías</h3>

      <div className="flex gap-4 mb-6">
        {(['activa', 'cerrada', 'prepago', 'mensual'] as const).map(tabName => (
          <button
            key={tabName}
            className={`px-4 py-2 rounded-full font-medium ${
              tab === tabName ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setTab(tabName)}
          >
            {tabName === 'mensual' ? 'Mensuales' : tabName.charAt(0).toUpperCase() + tabName.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'mensual' ? (
        <EstadiasMensuales /> // ✅ mostramos el componente de mensuales
      ) : estadiasEnTiempoReal.length === 0 ? (
        <div className="text-center text-gray-500 mt-8">
          No hay estadías {tab === 'activa' ? 'activas' : tab === 'cerrada' ? 'cerradas' : 'prepagas'} actualmente.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {estadiasEnTiempoReal.map(e => (
            <EstadiaCard key={e._id} estadia={e} />
          ))}
        </div>
      )}
    </section>
  );
};

export default EstadiasActivas;
