'use client';
import React from 'react';
import { useSession } from 'next-auth/react';
import { useTurno } from '@/app/hooks/Parking/Caja/useTurno';

interface TurnoPanelProps {
  operatorId: string;
  renderIngresosSalidas?: (turnoEstado: 'abierto' | 'cerrado' | 'pendiente_liquidacion' | 'liquidado' | null) => React.ReactNode;
}

function formatMoney(value?: number) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

function formatDate(value?: Date | string) {
  if (!value) return 'N/A';
  const d = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(d.getTime()) ? 'N/A' : d.toLocaleString();
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 last:border-b-0">
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900 text-right">{value}</span>
    </div>
  );
}

const TurnoPanel: React.FC<TurnoPanelProps> = ({ operatorId, renderIngresosSalidas }) => {
  const { data: session } = useSession();
  const { turno, abrirTurno: hookAbrirTurno, loading: loadingTurno, error: turnoError } = useTurno(operatorId);

  const abrirTurno = async () => {
    try {
      await hookAbrirTurno({
        operatorName: session?.user?.name ?? '',
        cajaNumero: 1,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const mostrarNumeroTurno = Boolean(turno?.numeroTurno && turno.numeroTurno > 0);
  const totalTickets = turno?.tickets?.length ?? 0;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {loadingTurno ? (
        <div className="dashboard-section p-6 text-center text-gray-500 font-medium">Cargando turno...</div>
      ) : turno ? (
        <div className="space-y-6">
          <div className="dashboard-section p-5 md:p-6">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Turno actual</h3>
                <p className="mt-1 text-sm text-gray-500">Ficha operativa del turno en curso.</p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
                <span className={`h-2.5 w-2.5 rounded-full ${turno.estado === 'abierto' ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                {turno.estado}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-x-10 md:grid-cols-2 xl:grid-cols-3">
              {mostrarNumeroTurno ? <Row label="Turno" value={turno.numeroTurno} /> : null}
              <Row label="Caja" value={String(turno.cajaNumero ?? turno.numeroCaja ?? 1).padStart(3, '0')} />
              <Row label="Apertura" value={formatDate(turno.fechaApertura)} />
              <Row label="Tickets" value={totalTickets} />
              <Row label="Total cobrado" value={formatMoney(turno.totalTurno)} />
              {turno.fechaCierre ? <Row label="Cierre" value={formatDate(turno.fechaCierre)} /> : null}
            </div>
          </div>

          {renderIngresosSalidas?.(turno.estado)}
        </div>
      ) : (
        <div className="dashboard-section p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900">Sin turno abierto</h3>
          <p className="mt-2 text-sm text-gray-500">Abrí un turno para comenzar a operar la caja.</p>
          <button onClick={abrirTurno} className="mt-5 rounded-xl border border-gray-300 bg-gray-200 px-5 py-3 font-semibold text-gray-800 hover:bg-gray-300">
            Abrir Turno
          </button>
          {turnoError ? <p className="mt-3 text-red-600">{turnoError}</p> : null}
        </div>
      )}
    </div>
  );
};

export default TurnoPanel;
