'use client';
import React from 'react';
import { ITarifa } from '@/interfaces/Tarifa/tarifa';
import { FaClock, FaCalendarDay, FaRegCalendarAlt, FaInfinity } from 'react-icons/fa';

interface TarifaCardProps {
  tarifa: ITarifa;
  tipo: 'prepago' | 'hora' | 'libre' | 'mensual';
}

// Colores por tipo de tarifa
const tipoColors: Record<string, string> = {
  prepago: 'from-yellow-100 to-yellow-50 text-yellow-800',
  hora: 'from-blue-100 to-blue-50 text-blue-700',
  libre: 'from-purple-100 to-purple-50 text-purple-700',
  mensual: 'from-green-100 to-green-50 text-green-700',
};

// Iconos por tipo de tarifa
const tipoIcon: Record<string, React.ReactNode> = {
  prepago: <FaRegCalendarAlt size={20} />,
  hora: <FaClock size={20} />,
  libre: <FaInfinity size={20} />,
  mensual: <FaCalendarDay size={20} />,
};


// Descripciones por tipo
const descripcionTipo: Record<string, string> = {
  prepago: 'Tarifa prepaga por tiempo definido',
  hora: 'Tarifa por hora',
  libre: 'Acceso libre sin límite de tiempo',
  mensual: 'Tarifa mensual',
};

// Componente para cada card
const TarifaCard: React.FC<TarifaCardProps> = ({ tarifa, tipo }) => {
  const colorClase = tipoColors[tipo];
  const icon = tipoIcon[tipo];

  // Obtener precio según tipo
  let precioUnitario = 0;
  if (tipo === 'prepago') precioUnitario = tarifa.tarifaLibre?.[0]?.precioUnitario ?? 0;
  else if (tipo === 'hora') precioUnitario = tarifa.tarifasHora?.[0]?.precioUnitario ?? 0;
  else if (tipo === 'libre') precioUnitario = tarifa.tarifaLibre?.[0]?.precioUnitario ?? 0;
  else if (tipo === 'mensual') precioUnitario = tarifa.tarifaMensual?.[0]?.precioUnitario ?? 0;

  return (
    <div
      className={`bg-gradient-to-br ${colorClase.split(' ')[0]} ${colorClase.split(' ')[1]} border border-gray-200 rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 p-6 flex flex-col justify-between`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-2xl font-bold">{tarifa.category}</div>
        <div className="text-gray-700">{icon}</div>
      </div>

      {/* Descripción */}
      <div className="text-gray-700 text-sm mb-4">{descripcionTipo[tipo]}</div>

      {/* Footer: precio y botón */}
      <div className="mt-auto flex justify-between items-center">
        <div className="text-xl font-semibold">{`$${precioUnitario}`}</div>
        <button className="px-4 py-2 bg-white text-gray-800 rounded-lg font-medium shadow hover:bg-gray-100 transition">
          Seleccionar
        </button>
      </div>
    </div>
  );
};

// Componente principal del grid
interface TarifasGridProps {
  tarifas: ITarifa[];
}

const TarifasGrid: React.FC<TarifasGridProps> = ({ tarifas }) => {
  return (
    <section className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <h2 className="text-3xl font-extrabold mb-8 text-gray-800">Nuestras Tarifas</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-6xl">
        {tarifas.map((t) => (
          <React.Fragment key={t._id}>
            <TarifaCard tarifa={t} tipo="prepago" />
            <TarifaCard tarifa={t} tipo="hora" />
            <TarifaCard tarifa={t} tipo="libre" />
            <TarifaCard tarifa={t} tipo="mensual" />
          </React.Fragment>
        ))}
      </div>
    </section>
  );
};

export default TarifasGrid;
