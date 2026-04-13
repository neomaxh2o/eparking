'use client';
import React from 'react';
import { useSession } from 'next-auth/react';
import { useTurno, TurnoData } from '@/app/hooks/Parking/Caja/useTurno';

const CajaOperador: React.FC = () => {
  const { data: session } = useSession();
  const operatorId = session?.user?.id;
  const { turno, loading, error, abrirTurno, cerrarTurno } = useTurno(operatorId || '');

  if (!operatorId) return <p>Debe iniciar sesión como operador</p>;

  return (
    <section className="p-4 border rounded shadow space-y-4">
      <h2 className="font-bold text-lg">Caja del Operador</h2>

      {loading && <p>Cargando...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!turno && (
        <button
          onClick={abrirTurno}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Abrir Turno
        </button>
      )}

      {turno && (
        <div>
          <p><strong>Estado:</strong> {turno.estado}</p>
          <p><strong>Fecha apertura:</strong> {new Date(turno.fechaApertura).toLocaleString()}</p>
          {turno.fechaCierre && (
            <p><strong>Fecha cierre:</strong> {new Date(turno.fechaCierre).toLocaleString()}</p>
          )}
          <p><strong>Total cobrado:</strong> ${turno.totalTurno}</p>

          <h3 className="mt-2 font-semibold">Tickets del turno</h3>
          <ul className="border rounded p-2 max-h-64 overflow-y-auto">
            {turno.tickets.map(ticket => (
              <li key={ticket.ticketNumber} className="border-b py-1">
                <p><strong>Ticket:</strong> {ticket.ticketNumber}</p>
                <p><strong>Patente:</strong> {ticket.patente}</p>
                <p><strong>Entrada:</strong> {new Date(ticket.horaEntrada).toLocaleTimeString()}</p>
                {ticket.horaSalida && (
                  <p><strong>Salida:</strong> {new Date(ticket.horaSalida).toLocaleTimeString()}</p>
                )}
                {ticket.totalCobrado !== undefined && (
                  <p><strong>Total:</strong> ${ticket.totalCobrado}</p>
                )}
              </li>
            ))}
          </ul>

          {turno.estado === 'abierto' && (
            <button
              onClick={cerrarTurno}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded"
            >
              Cerrar Turno
            </button>
          )}
        </div>
      )}
    </section>
  );
};

export default CajaOperador;
