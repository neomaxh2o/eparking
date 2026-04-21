'use client';

import React, { useMemo, useState } from 'react';
import clsx from 'clsx';
import { useTurno } from '@/app/hooks/Parking/Caja/useTurno';
import type { TurnoCaja } from '@/modules/caja/types/caja.types';
import TurnoEventsTable from '@/modules/turnos/components/TurnoEventsTable';

interface TurnoPanelProps {
  operatorId: string;
  renderIngresosSalidas?: (turnoEstado: 'abierto' | 'cerrado' | null) => React.ReactNode;
}

type LiquidacionInputs = {
  efectivo: number;
  tarjeta: number;
  otros: number;
  observacion: string;
};

function formatMoney(value?: number) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

function formatDate(value?: string | Date) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

function getTotalesSugeridos(turno: TurnoCaja | null): LiquidacionInputs {
  const base: LiquidacionInputs = { efectivo: 0, tarjeta: 0, otros: 0 };

  const tickets = Array.isArray(turno?.tickets) ? turno.tickets : [];
  for (const ticket of tickets) {
    const monto = Number(ticket.totalCobrado ?? 0);
    const metodo = ticket.metodoPago;

    if (metodo === 'tarjeta') {
      base.tarjeta += monto;
    } else if (metodo === 'qr' || metodo === 'otros') {
      base.otros += monto;
    } else {
      base.efectivo += monto;
    }
  }

  return base;
}

export default function TurnoPanelV2({
  operatorId,
  renderIngresosSalidas,
}: TurnoPanelProps) {
  const {
    turno,
    loading,
    error,
    abrirTurno,
    cerrarTurno,
    liquidarTurno,
  } = useTurno(operatorId);

  const sugerencias = useMemo(() => getTotalesSugeridos(turno), [turno]);
  const [inputs, setInputs] = useState<LiquidacionInputs>({
    efectivo: 0,
    tarjeta: 0,
    otros: 0,
    observacion: '',
  });

  const totalTurno = Number(turno?.totalTurno ?? 0);
  // compute expected total from tickets when totalTurno is zero to avoid misleading $0.00
  const expectedFromTickets = (turno?.tickets || []).reduce((acc: number, t: any) => {
    const tarifa = t?.tarifa || {};
    const qty = Number(t?.cantidad ?? t?.cantidadHoras ?? 1) || 1;
    if (typeof tarifa.precioTotalAplicado === 'number' && tarifa.precioTotalAplicado > 0) return acc + Number(tarifa.precioTotalAplicado);
    if (typeof tarifa.tarifaHora === 'number' && tarifa.tarifaHora > 0) return acc + Number(tarifa.tarifaHora) * Math.max(1, qty);
    if (typeof tarifa.tarifaBaseHora === 'number' && tarifa.tarifaBaseHora > 0) return acc + Number(tarifa.tarifaBaseHora) * Math.max(1, qty);
    return acc;
  }, 0);

  const totalDeclarado = inputs.efectivo + inputs.tarjeta + inputs.otros;
  const diferencia = totalDeclarado - totalTurno;
  const tieneNegativos = [inputs.efectivo, inputs.tarjeta, inputs.otros].some((value) => value < 0);
  const requiereObservacion = diferencia !== 0;
  const liquidacionValida =
    !!turno &&
    turno.estado === 'abierto' &&
    !tieneNegativos &&
    (!requiereObservacion || inputs.observacion.trim().length > 0);

  const handleSugerir = () => {
    setInputs((prev) => ({ ...prev, ...sugerencias }));
  };

  const handleLiquidar = async () => {
    if (!turno || turno.estado !== 'abierto') return;
    await liquidarTurno(inputs.efectivo, inputs.tarjeta, inputs.otros, inputs.observacion);
  };

  const handleDescargarReporte = () => {
    if (!turno?._id) return;
    window.open(`/api/v2/turno/${turno._id}/reporte`, '_blank', 'noopener,noreferrer');
  };

  const puedeCerrar =
    !!turno &&
    turno.estado === 'abierto' &&
    !!turno.liquidacion &&
    Number(turno.liquidacion.totalDeclarado ?? 0) === totalTurno;

  return (
    <section className="space-y-6">
      {!turno ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-lg font-bold text-gray-900">Caja sin turno activo</p>
              <p className="mt-1 text-sm text-gray-500">
                Abrí un turno para comenzar a operar cobros y cierres.
              </p>
            </div>

            <button
              onClick={() => void abrirTurno()}
              disabled={loading}
              className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Abriendo...' : 'Abrir Turno'}
            </button>
          </div>

          {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div
                className={clsx(
                  'mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                  turno.estado === 'abierto'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                )}
              >
                {turno.estado === 'abierto' ? 'Turno abierto' : 'Turno cerrado'}
              </div>
              <p className="text-sm text-gray-500">Caja</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {turno.numeroCaja ?? 0}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Apertura</p>
              <p className="mt-2 text-sm font-semibold text-gray-900">
                {formatDate(turno.fechaApertura)}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Tickets</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {turno.tickets?.length ?? 0}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Total turno</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {totalTurno > 0 ? (
                  formatMoney(totalTurno)
                ) : (expectedFromTickets > 0 ? (
                  <>{formatMoney(totalTurno)} <span className="text-sm font-medium text-gray-500">(esperado {formatMoney(expectedFromTickets)})</span></>
                ) : (
                  formatMoney(totalTurno)
                ))}
              </p>
            </div>
          </div>

          {loading && <p className="text-sm text-gray-500">Procesando...</p>}
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          {renderIngresosSalidas?.(
            turno.estado === 'abierto' || turno.estado === 'cerrado' ? turno.estado : null
          )}

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Liquidación y cierre</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Declará los medios de pago. Si hay diferencia, podés liquidar igual dejando observación.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSugerir}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Usar sugerencia automática
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Efectivo
                </label>
                <input
                  type="number"
                  min={0}
                  value={inputs.efectivo}
                  onChange={(e) =>
                    setInputs((prev) => ({
                      ...prev,
                      efectivo: Math.max(0, Number(e.target.value || 0)),
                    }))
                  }
                  className="w-full rounded-xl border border-gray-300 px-3 py-3 outline-none focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Sugerido: {formatMoney(sugerencias.efectivo)}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Tarjeta
                </label>
                <input
                  type="number"
                  min={0}
                  value={inputs.tarjeta}
                  onChange={(e) =>
                    setInputs((prev) => ({
                      ...prev,
                      tarjeta: Math.max(0, Number(e.target.value || 0)),
                    }))
                  }
                  className="w-full rounded-xl border border-gray-300 px-3 py-3 outline-none focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Sugerido: {formatMoney(sugerencias.tarjeta)}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  QR / Otros
                </label>
                <input
                  type="number"
                  min={0}
                  value={inputs.otros}
                  onChange={(e) =>
                    setInputs((prev) => ({
                      ...prev,
                      otros: Math.max(0, Number(e.target.value || 0)),
                    }))
                  }
                  className="w-full rounded-xl border border-gray-300 px-3 py-3 outline-none focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Sugerido: {formatMoney(sugerencias.otros)}
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Total declarado</p>
                <p className="mt-1 text-xl font-bold text-gray-900">
                  {formatMoney(totalDeclarado)}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Total turno</p>
                <p className="mt-1 text-xl font-bold text-gray-900">
                  {formatMoney(totalTurno)}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Diferencia</p>
                <p
                  className={clsx(
                    'mt-1 text-xl font-bold',
                    diferencia === 0 ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {formatMoney(diferencia)}
                </p>
              </div>
            </div>

            {tieneNegativos && (
              <p className="mt-4 text-sm font-medium text-red-600">
                Los valores de liquidación no pueden ser negativos.
              </p>
            )}

            {!tieneNegativos && diferencia !== 0 && (
              <p className="mt-4 text-sm font-medium text-amber-700">
                La liquidación tiene diferencia. Podés continuar si dejás observación.
              </p>
            )}

            <div className="mt-4">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Observación de liquidación
              </label>
              <textarea
                value={inputs.observacion}
                onChange={(e) =>
                  setInputs((prev) => ({
                    ...prev,
                    observacion: e.target.value,
                  }))
                }
                placeholder={
                  diferencia !== 0
                    ? 'Describí la diferencia detectada en caja...'
                    : 'Observación opcional del cierre...'
                }
                className="min-h-[96px] w-full rounded-xl border border-gray-300 px-3 py-3 outline-none focus:border-blue-500"
              />
            </div>

            {turno.liquidacion && (
              <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                <p>
                  Turno liquidado el {formatDate(turno.liquidacion.fechaLiquidacion)} con total
                  declarado de {formatMoney(turno.liquidacion.totalDeclarado)}.
                </p>
                <p className="mt-1">
                  Sistema: {formatMoney(turno.liquidacion.totalSistema)} · Diferencia:{' '}
                  {formatMoney(turno.liquidacion.diferencia)} · Tipo:{' '}
                  {turno.liquidacion.tipoDiferencia ?? 'sin_diferencia'}
                </p>
                {turno.liquidacion.observacion ? (
                  <p className="mt-1">Obs.: {turno.liquidacion.observacion}</p>
                ) : null}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 md:flex-row">
              <button
                onClick={() => void handleLiquidar()}
                disabled={!liquidacionValida || loading}
                className={clsx(
                  'rounded-xl px-5 py-3 font-semibold text-white',
                  !liquidacionValida || loading
                    ? 'cursor-not-allowed bg-blue-300'
                    : 'bg-blue-600 hover:bg-blue-700'
                )}
              >
                Liquidar turno
              </button>

              <button
                onClick={() => void cerrarTurno()}
                disabled={!puedeCerrar || loading}
                className={clsx(
                  'rounded-xl px-5 py-3 font-semibold text-white',
                  !puedeCerrar || loading
                    ? 'cursor-not-allowed bg-red-300'
                    : 'bg-red-600 hover:bg-red-700'
                )}
              >
                Cerrar turno
              </button>

              <button
                type="button"
                onClick={handleDescargarReporte}
                className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
                title="Abre reporte imprimible/guardable como PDF"
              >
                Descargar reporte PDF
              </button>
            </div>
          </div>

          <TurnoEventsTable />
        </>
      )}
    </section>
  );
}
