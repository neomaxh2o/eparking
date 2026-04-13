'use client';
import React from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { EstadiasAnimadas } from '@/types/EstadiaUI';

dayjs.extend(utc);
dayjs.extend(timezone);
const ZONA_ARG = 'America/Argentina/Buenos_Aires';

const categoriaColors: Record<string, string> = {
  'Automóvil': 'from-blue-100 to-blue-50 text-blue-700 hover:shadow-blue-400',
  'Camioneta': 'from-green-100 to-green-50 text-green-700 hover:shadow-green-400',
  'Motocicleta': 'from-purple-100 to-purple-50 text-purple-700 hover:shadow-purple-400',
  'Bicicleta': 'from-yellow-100 to-yellow-50 text-yellow-700 hover:shadow-yellow-400',
  'Otros': 'from-gray-100 to-gray-50 text-gray-700 hover:shadow-gray-400',
};

interface EstadiaCardProps {
  estadia: EstadiasAnimadas;
}

const EstadiaCard: React.FC<EstadiaCardProps> = ({ estadia: e }) => {
  const colorClase = e.color || categoriaColors[e.categoria] || categoriaColors['Otros'];

  const horaIngresoArg = e.horaEntrada
    ? dayjs(e.horaEntrada).tz(ZONA_ARG).format('DD/MM/YYYY HH:mm')
    : '-';

  const horaSalidaArg = e.horaSalida
    ? dayjs(e.horaSalida).tz(ZONA_ARG).format('DD/MM/YYYY HH:mm')
    : undefined;

  // Lógica de tiempo restante o excedido
  let tiempoTexto: string | undefined;
  if (e.prepago) {
    if (e.tiempoExcedido) {
      tiempoTexto = `⏱️ Tiempo excedido: ${e.tiempoExcedido.dias}d ${e.tiempoExcedido.horas}h ${e.tiempoExcedido.minutos}m • $${(e.montoExcedido ?? 0).toFixed(2)} excedente`;
    } else if (e.tiempoRestante) {
      tiempoTexto = `⏳ Tiempo restante: ${e.tiempoRestante.dias}d ${e.tiempoRestante.horas}h ${e.tiempoRestante.minutos}m`;
    }
  }

  return (
    <div
      className={`bg-gradient-to-b ${colorClase.split(' ')[0]} ${colorClase.split(' ')[2]} border border-gray-200 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 hover:scale-105 transition-all duration-300 p-4 flex flex-col justify-between`}
    >
      {/* Header */}
      <div className="mb-2">
        <div className={`text-lg font-semibold ${colorClase.split(' ')[1]} ${e.parpadeo ? 'animate-pulse' : ''}`}>
          {e.patente}
        </div>
        <div className="text-xs text-gray-500 mt-1">{e.categoria} • {e.ticket}</div>
        <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
          {e.tipoEstadia === 'hora'
            ? '⏱️ Por hora'
            : e.tipoEstadia === 'dia'
            ? `📅 Por día${e.dias ? ` (${e.dias} días)` : ''}`
            : '♾️ Libre'}
        </span>
        {e.prepago && (
          <span className="inline-block ml-2 mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
            💰 Prepago
          </span>
        )}
      </div>

      {/* Cuerpo Principal */}
      <div className="flex justify-between items-center mt-2">
        {!e.prepago && (
          <div className="text-xs text-gray-400">
            ⏳ {e.tiempoTranscurrido.horas}h {e.tiempoTranscurrido.minutos}m {e.tiempoTranscurrido.segundos}s
          </div>
        )}
        <div className={`font-semibold text-xl ${colorClase.split(' ')[1]} ${e.parpadeo ? 'animate-pulse' : ''}`}>
          ${e.montoAnimado.toFixed(2)}
        </div>
      </div>

      {/* Detalle de cobro */}
      {e.detalleCobro && (
        <div className="text-xs text-gray-600 mt-2 border-t border-gray-200 pt-1">
          {e.detalleCobro}
        </div>
      )}

      {/* Footer */}
      <div className="text-xs text-gray-400 mt-2 flex flex-col gap-1">
        {e.prepago ? (
          <>
            <div>🟢 Entrada: {horaIngresoArg}</div>
            {horaSalidaArg && <div>🔴 Salida: {horaSalidaArg}</div>}
            {tiempoTexto && (
              <div className={`${e.tiempoExcedido ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                {tiempoTexto}
              </div>
            )}
          </>
        ) : (
          <div>🕒 Entrada: {horaIngresoArg}</div>
        )}
      </div>
    </div>
  );
};

export default EstadiaCard;
