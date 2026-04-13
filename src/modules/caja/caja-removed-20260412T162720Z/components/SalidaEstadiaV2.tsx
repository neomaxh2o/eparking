'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import Modal from '@/app/components/Parking/Estadias/Modal';
import TicketSalida from '@/app/components/Parking/Estadias/TicketSalida';
import { useSalida } from '@/app/hooks/Parking/Caja/useSalida';
import { useCalculoEstadia } from '@/app/hooks/Parking/Caja/useCalculoEstadia';
import type { TicketCaja } from '@/modules/caja/types/caja.types';
import { describeCommercialUnit } from '@/modules/caja/server/commercial';

type MetodoPago = 'efectivo' | 'tarjeta' | 'qr' | 'otros';

function formatMoney(value?: number) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
}

function buildCobroResumen(ticket: TicketCaja, calculo: { total: number; detalle: string; tiempoTotal: string }) {
  return {
    unidadLabel: 'Unidad comercial aplicada',
    unidadValue: describeCommercialUnit(ticket),
    tiempoLabel: 'Tiempo transcurrido',
    tiempoValue: calculo.tiempoTotal,
  };
}

export default function SalidaEstadiaV2({
  nombreEstacionamiento,
  refresh,
}: {
  nombreEstacionamiento?: string;
  refresh?: () => void;
}) {
  const { data: session } = useSession();
  const operatorName = session?.user?.name ?? 'Operador';

  const { registrarSalida, obtenerTicket, cerrarPrepago, loading, error } = useSalida();
  const { calcularEstadia } = useCalculoEstadia();

  const [ticketNumber, setTicketNumber] = useState('');
  const [ticketLocal, setTicketLocal] = useState<TicketCaja | null>(null);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('efectivo');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const ticketRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const buscarTicket = async (rawTicketNumber?: string) => {
    const value = (rawTicketNumber ?? ticketNumber).trim();

    if (!value) {
      setTicketLocal(null);
      return;
    }

    const result = await obtenerTicket(value);
    if (!result) {
      setTicketLocal(null);
      return;
    }

    setTicketLocal(result);
    setMetodoPago((result.metodoPago || 'efectivo') as MetodoPago);
  };

  const calculo = useMemo(() => {
    if (!ticketLocal) {
      return { total: 0, detalle: '', tiempoTotal: '0h 0m 0s' };
    }

    return calcularEstadia(ticketLocal, ticketLocal.tarifa);
  }, [ticketLocal, calcularEstadia]);

  const resumenCobro = useMemo(() => {
    if (!ticketLocal) return null;
    return buildCobroResumen(ticketLocal, calculo);
  }, [ticketLocal, calculo]);

  const cantidadAplicadaLabel = useMemo(() => {
    if (!ticketLocal) return '-';
    return describeCommercialUnit(ticketLocal);
  }, [ticketLocal]);

  const limpiarFormulario = () => {
    setTicketNumber('');
    setTicketLocal(null);
    setMetodoPago('efectivo');
  };

  const handleCobrar = async () => {
    if (!ticketLocal) return;

    const result = await registrarSalida({
      ...ticketLocal,
      metodoPago,
      totalCobrado: calculo.total,
      detalleCobro: calculo.detalle,
      tiempoTotal: calculo.tiempoTotal,
    });

    if (!result) return;

    setTicketLocal(result);
    setIsModalOpen(true);
    refresh?.();
  };

  const handleCerrarModal = () => {
    setIsModalOpen(false);
    limpiarFormulario();
    window.setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isTypingTarget = tag === 'input' || tag === 'textarea' || tag === 'select' || Boolean(target?.isContentEditable);
      if (isTypingTarget) return;
      if (loading || !ticketLocal) return;

      if (event.key.toLowerCase() === 'f' && !ticketLocal.prepago) {
        event.preventDefault();
        void handleCobrar();
      }

      if (event.key.toLowerCase() === 'p' && ticketLocal.prepago) {
        event.preventDefault();
        void (async () => {
          const result = await cerrarPrepago(ticketLocal);
          if (!result) return;
          setTicketLocal(result);
          setIsModalOpen(true);
          refresh?.();
        })();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [loading, ticketLocal, cerrarPrepago, refresh]);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900">Salida de estadía</h2>
      <p className="mb-4 text-sm text-gray-500">Búsqueda de ticket y cierre de cobro.</p>

      <div className="mb-6 flex gap-2">
        <input
          ref={inputRef}
          autoFocus
          value={ticketNumber}
          onChange={(e) => setTicketNumber(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void buscarTicket();
            }
          }}
          placeholder="T-XXXXXXXX"
          className="flex-1 rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-gray-500"
        />

        <button
          onClick={() => void buscarTicket()}
          disabled={loading || !ticketNumber.trim()}
          className="rounded-xl bg-gray-900 px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          Buscar
        </button>
      </div>

      {!ticketLocal ? (
        <p className="text-sm text-gray-500">Buscá un ticket para ver la información.</p>
      ) : ticketLocal.prepago ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-3">
          <p className="text-sm font-medium text-amber-800">
            Este ticket es prepago. Puede cerrarse con el flujo modular de salida o desde el panel de Estadías.
          </p>
          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
            <div>
              <strong>Ticket:</strong> {ticketLocal.ticketNumber}
            </div>
            <div>
              <strong>Estado:</strong> {ticketLocal.estado}
            </div>
            <div>
              <strong>Patente:</strong> {ticketLocal.patente}
            </div>
            <div>
              <strong>Categoría:</strong> {ticketLocal.categoria}
            </div>
            <div>
              <strong>Tipo:</strong> {describeCommercialUnit(ticketLocal)}
            </div>
            <div>
              <strong>Creado:</strong> {formatDate(ticketLocal.createdAt)}
            </div>
            <div>
              <strong>Inicio:</strong> {formatDate(ticketLocal.horaEntrada)}
            </div>
            <div>
              <strong>Expira:</strong>{' '}
              <span className="font-semibold text-red-600 underline decoration-red-500 underline-offset-2">
                {formatDate(ticketLocal.horaExpiracion)}
              </span>
            </div>
          </div>

          <button
            onClick={async () => {
              const result = await cerrarPrepago(ticketLocal);
              if (!result) return;
              setTicketLocal(result);
              setIsModalOpen(true);
              refresh?.();
            }}
            disabled={loading}
            className="w-full rounded-xl bg-amber-600 py-3 font-semibold text-white disabled:opacity-60"
          >
            Cerrar prepago (P)
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
            <div>
              <strong>Ticket:</strong> {ticketLocal.ticketNumber}
            </div>
            <div>
              <strong>Estado:</strong> {ticketLocal.estado}
            </div>
            <div>
              <strong>Patente:</strong> {ticketLocal.patente}
            </div>
            <div>
              <strong>Categoría:</strong> {ticketLocal.categoria}
            </div>
            <div>
              <strong>Tipo:</strong> {describeCommercialUnit(ticketLocal)}
            </div>
            <div>
              <strong>Creado:</strong> {formatDate(ticketLocal.createdAt)}
            </div>
            <div>
              <strong>Inicio:</strong> {formatDate(ticketLocal.horaEntrada)}
            </div>
            <div>
              <strong>Expira:</strong>{' '}
              <span className="font-semibold text-red-600 underline decoration-red-500 underline-offset-2">
                {formatDate(ticketLocal.horaExpiracion)}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-gray-100 p-4 space-y-2">
            {resumenCobro && (
              <>
                <p className="text-sm text-gray-600">
                  <strong>{resumenCobro.unidadLabel}:</strong> {resumenCobro.unidadValue}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Unidad persistida:</strong> {cantidadAplicadaLabel}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>{resumenCobro.tiempoLabel}:</strong> {resumenCobro.tiempoValue}
                </p>
              </>
            )}
            <p className="text-sm text-gray-600">
              <strong>Detalle de cobro:</strong> {calculo.detalle}
            </p>

            <p className="mt-2 text-2xl font-bold text-gray-900">{formatMoney(calculo.total)}</p>
          </div>

          <select
            value={metodoPago}
            onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-gray-500"
          >
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="qr">QR</option>
            <option value="otros">Otros</option>
          </select>

          <button
            onClick={() => void handleCobrar()}
            disabled={loading}
            className="w-full rounded-xl bg-gray-900 py-3 font-semibold text-white disabled:opacity-60"
          >
            Cobrar y cerrar (F)
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-red-600">{error}</p>}

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
