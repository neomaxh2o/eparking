'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import Modal from '@/app/components/Parking/Estadias/Modal';
import TicketSalida from '@/app/components/Parking/Estadias/TicketSalida';
import { useSalida } from '@/app/hooks/Parking/Caja/useSalida';
import { useCalculoEstadia } from '@/app/hooks/Parking/Caja/useCalculoEstadia';
import type { TarifaSnapshot, TicketCaja } from '@/modules/caja/types/caja.types';

type MetodoPago = 'efectivo' | 'tarjeta' | 'qr' | 'otros';

interface CajaCobroRapidoV2Props {
  nombreEstacionamiento?: string;
  onSuccess?: () => void | Promise<void>;
}

function formatMoney(value?: number) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

export default function CajaCobroRapidoV2({
  nombreEstacionamiento = 'Estacionamiento',
  onSuccess,
}: CajaCobroRapidoV2Props) {
  const { data: session } = useSession();
  const operatorName = session?.user?.name ?? 'Operador';

  const { registrarSalida, obtenerTicket, loading, error } = useSalida();
  const { calcularEstadia } = useCalculoEstadia();

  const [ticketNumber, setTicketNumber] = useState('');
  const [ticketLocal, setTicketLocal] = useState<TicketCaja | null>(null);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('efectivo');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ticketNumber.trim()) {
      setTicketLocal(null);
      return;
    }

    const timeout = setTimeout(async () => {
      const result = await obtenerTicket(ticketNumber.trim());
      if (!result) {
        setTicketLocal(null);
        return;
      }

      setTicketLocal(result);
      setMetodoPago((result.metodoPago || 'efectivo') as MetodoPago);
    }, 300);

    return () => clearTimeout(timeout);
  }, [ticketNumber, obtenerTicket]);

  const tarifaAplicable: TarifaSnapshot | undefined = useMemo(() => {
    if (!ticketLocal) return undefined;

    return {
      ...(ticketLocal.tarifa ?? {}),
      tarifaBaseHora: Number(
        ticketLocal.tarifa?.tarifaBaseHora ?? ticketLocal.tarifaBaseHora ?? 0
      ),
      tarifaHora: Number(
        ticketLocal.tarifa?.tarifaHora ??
          ticketLocal.tarifa?.tarifaBaseHora ??
          ticketLocal.tarifaBaseHora ??
          0
      ),
      tarifaDia: Number(ticketLocal.tarifa?.tarifaDia ?? 0),
      tarifaLibre: Number(ticketLocal.tarifa?.tarifaLibre ?? ticketLocal.totalCobrado ?? 0),
      fraccionMinutos: Number(ticketLocal.tarifa?.fraccionMinutos ?? 60),
    };
  }, [ticketLocal]);

  const calculo = useMemo(() => {
    if (!ticketLocal) {
      return { total: 0, detalle: '', tiempoTotal: '0h 0m 0s' };
    }

    return calcularEstadia(ticketLocal, tarifaAplicable);
  }, [ticketLocal, tarifaAplicable, calcularEstadia]);

  const handleBuscar = async () => {
    if (!ticketNumber.trim()) return;

    const result = await obtenerTicket(ticketNumber.trim());
    if (!result) {
      setTicketLocal(null);
      return;
    }

    setTicketLocal(result);
    setMetodoPago((result.metodoPago || 'efectivo') as MetodoPago);
  };

  const handleCobrarYDarSalida = async () => {
    if (!ticketLocal) return;

    const result = await registrarSalida({
      ...ticketLocal,
      metodoPago,
      tarifa: tarifaAplicable,
      totalCobrado: calculo.total,
      detalleCobro: calculo.detalle,
      tiempoTotal: calculo.tiempoTotal,
    });

    if (!result) return;

    setTicketLocal(result);
    setIsModalOpen(true);
    await onSuccess?.();
  };

  const handleCerrarModal = () => {
    setIsModalOpen(false);
    setTicketNumber('');
    setTicketLocal(null);
    setMetodoPago('efectivo');
  };

  const handleImprimir = () => {
    if (!ticketRef.current) return;

    const printContents = ticketRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Cobro y salida</h2>
        <p className="mt-1 text-sm text-gray-500">
          Buscá un ticket, revisá la información y finalizá la operación.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Buscar ticket
            </label>

            <div className="flex gap-2">
              <input
                value={ticketNumber}
                onChange={(e) => setTicketNumber(e.target.value)}
                placeholder="T-20260407090535-9879"
                className="flex-1 rounded-xl border border-gray-300 bg-white px-3 py-3 outline-none focus:border-gray-500"
              />
              <button
                onClick={() => void handleBuscar()}
                disabled={loading || !ticketNumber.trim()}
                className="rounded-xl bg-gray-900 px-4 py-3 font-semibold text-white disabled:opacity-60"
              >
                Buscar
              </button>
            </div>

            {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="text-lg font-bold text-gray-900">Método de pago</h3>
            <p className="mt-1 text-sm text-gray-500">
              Seleccioná cómo se registra el cobro.
            </p>

            <select
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
              className="mt-4 w-full rounded-xl border border-gray-300 px-3 py-3 outline-none focus:border-gray-500"
              disabled={!ticketLocal}
            >
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="qr">QR</option>
              <option value="otros">Otros</option>
            </select>

            <button
              onClick={() => void handleCobrarYDarSalida()}
              disabled={!ticketLocal || loading}
              className="mt-5 w-full rounded-xl bg-gray-900 px-5 py-3 font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cobrar y dar salida
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900">Información del ticket</h3>

            {!ticketLocal ? (
              <p className="mt-3 text-sm text-gray-500">
                Buscá un ticket para ver la información del cobro.
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Ticket</p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {ticketLocal.ticketNumber}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Estado</p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {ticketLocal.estado}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Patente</p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {ticketLocal.patente || 'SIN PATENTE'}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Categoría</p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {ticketLocal.categoria}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Tipo de estadía</p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {ticketLocal.tipoEstadia}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Tarifa base por hora
                  </p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {formatMoney(
                      ticketLocal.tarifa?.tarifaBaseHora ?? ticketLocal.tarifaBaseHora ?? 0
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4 md:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Entrada</p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {formatDate(ticketLocal.horaEntrada)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900">Resumen de cobro</h3>

            {!ticketLocal ? (
              <p className="mt-3 text-sm text-gray-500">Sin ticket seleccionado.</p>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="rounded-xl bg-white p-4">
                  <p className="text-sm text-gray-500">Tiempo total</p>
                  <p className="mt-1 text-base font-semibold text-gray-900">
                    {calculo.tiempoTotal}
                  </p>
                </div>

                <div className="rounded-xl bg-white p-4">
                  <p className="text-sm text-gray-500">Detalle</p>
                  <p className="mt-1 text-base font-semibold text-gray-900">
                    {calculo.detalle || '-'}
                  </p>
                </div>

                <div className="rounded-xl bg-white p-4">
                  <p className="text-sm text-gray-500">Método de pago</p>
                  <p className="mt-1 text-base font-semibold text-gray-900">{metodoPago}</p>
                </div>

                <div className="rounded-2xl bg-gray-900 p-5 text-white">
                  <p className="text-sm text-gray-300">Total a cobrar</p>
                  <p className="mt-2 text-3xl font-bold">{formatMoney(calculo.total)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCerrarModal}>
        <div ref={ticketRef}>
          {ticketLocal && (
            <TicketSalida
              ticket={ticketLocal}
              nombreEstacionamiento={nombreEstacionamiento}
              operatorName={operatorName}
              parkingName={nombreEstacionamiento}
            />
          )}
        </div>

        <button
          onClick={handleImprimir}
          className="mt-2 w-full rounded bg-green-600 px-4 py-2 text-white"
        >
          Imprimir Ticket
        </button>
      </Modal>
    </section>
  );
}
