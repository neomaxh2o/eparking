'use client';

import React, { useMemo } from 'react';
import type { TurnoCaja } from '@/modules/caja/types/caja.types';

interface CajaPendientesDrawerV2Props {
  open: boolean;
  onClose: () => void;
  pendientes: TurnoCaja[];
  onSelect: (turno: TurnoCaja) => void;
}

function formatMoney(value?: number) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
}

export default function CajaPendientesDrawerV2({ open, onClose, pendientes, onSelect }: CajaPendientesDrawerV2Props) {
  const totalPendientes = useMemo(() => pendientes.length, [pendientes]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      <aside className="w-full max-w-xl border-l border-gray-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 md:px-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Subturnos pendientes</h2>
            <p className="mt-1 text-sm text-gray-500">
              Pendientes de liquidación y cierre: {totalPendientes}
            </p>
          </div>

          <button onClick={onClose} className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            Cerrar
          </button>
        </div>

        <div className="max-h-[calc(100vh-88px)] overflow-y-auto p-5 md:p-6">
          {!pendientes.length ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
              <p className="text-sm text-gray-500">No hay subturnos pendientes de liquidación.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendientes.map((turno) => (
                <div key={turno._id} className="dashboard-section p-5">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Caja</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{turno.numeroCaja}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Estado</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{turno.estado}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Apertura</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{formatDate(turno.fechaApertura)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Cierre operativo</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{formatDate(turno.fechaCierreOperativo)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Tickets</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{turno.tickets?.length ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Total</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{formatMoney(turno.totalTurno)}</p>
                    </div>
                  </div>

                  <button onClick={() => onSelect(turno)} className="mt-4 w-full rounded-xl border border-gray-300 bg-gray-200 px-4 py-3 font-semibold text-gray-800 hover:bg-gray-300">
                    Liquidar este subturno
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
