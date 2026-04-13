'use client';

import React, { memo } from 'react';
import { useSession } from 'next-auth/react';
import { useTurnoEventos } from '@/modules/turnos/hooks/useTurnoEventos';

function formatDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

function formatMoney(value?: number) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

function badgeClass(estado: string) {
  if (estado.includes('VENCIDO')) return 'bg-red-100 text-red-700';
  if (estado.includes('PREPAGO')) return 'bg-amber-100 text-amber-700';
  if (estado.includes('COBRADO')) return 'bg-green-100 text-green-700';
  if (estado.includes('ACTIVO')) return 'bg-blue-100 text-blue-700';
  return 'bg-gray-100 text-gray-700';
}

function TurnoEventsTableInner() {
  const { data: session } = useSession();
  const operatorId = session?.user?.id;
  const { items, loading, error } = useTurnoEventos(operatorId);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-gray-900">Log operativo del turno actual</h3>
        <span className="text-xs text-gray-400">Actualización manual / por recarga</span>
      </div>

      {loading && !items.length ? (
        <p className="mt-3 text-sm text-gray-500">Cargando eventos del turno...</p>
      ) : error ? (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      ) : !items.length ? (
        <p className="mt-3 text-sm text-gray-500">Todavía no hay tickets/eventos en este turno.</p>
      ) : (
        <>
          <div className="mt-4 space-y-3 md:hidden">
            {items.map((row) => (
              <div key={row.ticket} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{row.evento}</p>
                    <p className="mt-1 text-xs text-gray-500">{formatDate(row.hora)}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${badgeClass(row.estado)}`}>
                    {row.estado}
                  </span>
                </div>

                <div className="mt-3 space-y-2 text-sm text-gray-600">
                  <p><strong>Ticket:</strong> {row.ticket}</p>
                  <p><strong>Patente:</strong> {row.patente || 'SIN PATENTE'}</p>
                  <p><strong>Tipo:</strong> {row.tipo}</p>
                  <p><strong>Prepago:</strong> {row.prepago ? 'Sí' : 'No'}</p>
                  <p><strong>Vence:</strong> {formatDate(row.vence)}</p>
                  <p><strong>Total:</strong> {formatMoney(row.total)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 hidden overflow-x-auto transition-opacity duration-300 md:block">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-600">
                  <th className="px-3 py-2">Hora</th>
                  <th className="px-3 py-2">Evento</th>
                  <th className="px-3 py-2">Ticket</th>
                  <th className="px-3 py-2">Patente</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Prepago</th>
                  <th className="px-3 py-2">Vence</th>
                  <th className="px-3 py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.ticket} className="border-b border-gray-100">
                    <td className="px-3 py-2">{formatDate(row.hora)}</td>
                    <td className="px-3 py-2 font-medium text-gray-900">{row.evento}</td>
                    <td className="px-3 py-2">{row.ticket}</td>
                    <td className="px-3 py-2">{row.patente || 'SIN PATENTE'}</td>
                    <td className="px-3 py-2">{row.tipo}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${badgeClass(row.estado)}`}>
                        {row.estado}
                      </span>
                    </td>
                    <td className="px-3 py-2">{row.prepago ? 'Sí' : 'No'}</td>
                    <td className="px-3 py-2">{formatDate(row.vence)}</td>
                    <td className="px-3 py-2">{formatMoney(row.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

const TurnoEventsTable = memo(TurnoEventsTableInner);
export default TurnoEventsTable;
