'use client';
import React from 'react';
import { useEstadiasContext } from '@/app/context/EstadiasContext';
import EstadiaCard from './UI/EstadiaCard';
import type { EstadiasAnimadas } from '@/types/EstadiaUI';

const EstadiasMensuales: React.FC = () => {
  const { estadias } = useEstadiasContext();

  if (!estadias) return null;

  console.log('Todas las estadías:', estadias);

  // Filtrar solo las estadías mensuales
  const estadiasMensualesRaw = estadias.filter(e => e.tipoEstadia === 'mensual');
  console.log('Estadías filtradas como mensuales:', estadiasMensualesRaw);

  const estadiasAnimadas: EstadiasAnimadas[] = estadiasMensualesRaw.map(e => {
    const horaEntrada = e.horaEntrada ? new Date(e.horaEntrada) : new Date();
    const horaSalida = e.horaSalida ? new Date(e.horaSalida) : undefined;

    const now = new Date();
    const diff = horaSalida ? horaSalida.getTime() - horaEntrada.getTime() : now.getTime() - horaEntrada.getTime();
    const horas = Math.floor(diff / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((diff % (1000 * 60)) / 1000);

    const animada: EstadiasAnimadas = {
  ...e,
  _id: e._id.toString(),
  montoEstimado: e.totalCobrado ?? 0,
  montoAnimado: 0,
  color: '', // <-- asignamos vacío y dejamos que EstadiaCard lo maneje
  horaIngresoFormateada: horaEntrada.toLocaleTimeString(),
  tiempoTranscurrido: { horas, minutos, segundos },
  parpadeo: e.estado === 'activa',
};


    console.log('Estadia animada:', animada);
    return animada;
  });

  return (
    <section className="p-4 bg-gray-50 min-h-screen">
      <h3 className="text-2xl font-semibold mb-4 text-gray-800">Estadías Mensuales</h3>

      {estadiasAnimadas.length === 0 ? (
        <div className="text-center text-gray-500 mt-8">
          No hay estadías mensuales actualmente.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {estadiasAnimadas.map(e => (
            <EstadiaCard key={e._id} estadia={e} />
          ))}
        </div>
      )}
    </section>
  );
};

export default EstadiasMensuales;
