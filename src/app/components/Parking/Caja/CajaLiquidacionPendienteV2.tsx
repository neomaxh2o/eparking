'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { TurnoCaja } from '@/modules/caja/types/caja.types';

interface CajaLiquidacionPendienteV2Props {
  turno: TurnoCaja | null;
  loading?: boolean;
  error?: string | null;
  onLiquidar: (payload: { efectivo: number; tarjeta: number; otros: number; observacion?: string }) => void | Promise<void>;
  onCerrar: () => void | Promise<void>;
  onVolver: () => void;
}

function formatMoney(value?: number) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
}

export default function CajaLiquidacionPendienteV2({ turno, loading = false, error = null, onLiquidar, onCerrar, onVolver }: CajaLiquidacionPendienteV2Props) {
  const [efectivo, setEfectivo] = useState(0);
  const [tarjeta, setTarjeta] = useState(0);
  const [otros, setOtros] = useState(0);
  const [observacion, setObservacion] = useState('');

  useEffect(() => {
    if (!turno) return;
    setEfectivo(Number(turno.liquidacion?.efectivo ?? 0));
    setTarjeta(Number(turno.liquidacion?.tarjeta ?? 0));
    setOtros(Number(turno.liquidacion?.otros ?? 0));
    setObservacion(String(turno.liquidacion?.observacion ?? ''));
  }, [turno]);

  const totalDeclarado = useMemo(() => Number(efectivo) + Number(tarjeta) + Number(otros), [efectivo, tarjeta, otros]);
  const totalTurno = Number(turno?.totalTurno ?? 0);
  const diferencia = totalDeclarado - totalTurno;
  const conciliado = Math.abs(diferencia) < 0.0001;
  const requiereObservacion = !conciliado;

  if (!turno) return null;

  return (
    <section className="dashboard-section p-5 md:p-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Liquidación y cierre</h2>
          <p className="mt-1 text-sm text-gray-500">Subturno pendiente seleccionado para liquidación final.</p>
        </div>

        <button onClick={onVolver} className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
          Volver a pendientes
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Caja</p>
          <p className="mt-2 text-xl font-bold text-gray-900">{turno.numeroCaja}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Apertura</p>
          <p className="mt-2 text-sm font-semibold text-gray-900">{formatDate(turno.fechaApertura)}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Cierre operativo</p>
          <p className="mt-2 text-sm font-semibold text-gray-900">{formatDate(turno.fechaCierreOperativo)}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Total subturno</p>
          <p className="mt-2 text-xl font-bold text-gray-900">{formatMoney(turno.totalTurno)}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">Efectivo</label>
          <input type="number" min={0} value={efectivo} onChange={(e) => setEfectivo(Math.max(0, Number(e.target.value || 0)))} className="w-full rounded-xl border border-gray-300 px-3 py-3 outline-none focus:border-gray-500" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">Tarjeta</label>
          <input type="number" min={0} value={tarjeta} onChange={(e) => setTarjeta(Math.max(0, Number(e.target.value || 0)))} className="w-full rounded-xl border border-gray-300 px-3 py-3 outline-none focus:border-gray-500" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">QR / Otros</label>
          <input type="number" min={0} value={otros} onChange={(e) => setOtros(Math.max(0, Number(e.target.value || 0)))} className="w-full rounded-xl border border-gray-300 px-3 py-3 outline-none focus:border-gray-500" />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Total declarado</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{formatMoney(totalDeclarado)}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Total subturno</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{formatMoney(totalTurno)}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Diferencia</p>
          <p className={`mt-1 text-xl font-bold ${conciliado ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatMoney(diferencia)}
          </p>
        </div>
      </div>

      {turno.liquidacion ? (
        <p className="mt-4 text-sm text-blue-700">
          Subturno ya liquidado el {formatDate(turno.liquidacion.fechaLiquidacion)}. Podés reliquidarlo si necesitás corregir importes antes del cierre.
        </p>
      ) : null}

      {!conciliado ? (
        <p className="mt-4 text-sm font-medium text-amber-700">
          La liquidación tiene diferencia. Podés liquidar igual si dejás observación.
        </p>
      ) : null}

      <div className="mt-4">
        <label className="mb-2 block text-sm font-semibold text-gray-700">Observación de liquidación</label>
        <textarea
          value={observacion}
          onChange={(e) => setObservacion(e.target.value)}
          placeholder={!conciliado ? 'Describí la diferencia detectada en el subturno...' : 'Observación opcional del cierre...'}
          className="min-h-[96px] w-full rounded-xl border border-gray-300 px-3 py-3 outline-none focus:border-gray-500"
        />
      </div>

      {error ? <p className="mt-4 text-sm font-medium text-red-600">{error}</p> : null}

      <div className="mt-6 flex flex-col gap-3 md:flex-row">
        <button onClick={() => void onLiquidar({ efectivo, tarjeta, otros, observacion })} disabled={loading || (requiereObservacion && !observacion.trim())} className="rounded-xl border border-gray-300 bg-gray-200 px-5 py-3 font-semibold text-gray-800 hover:bg-gray-300 disabled:opacity-60">
          Liquidar subturno
        </button>

        <button onClick={() => void onCerrar()} disabled={loading || !turno.liquidacion} className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60">
          Cerrar definitivamente
        </button>
      </div>
    </section>
  );
}
