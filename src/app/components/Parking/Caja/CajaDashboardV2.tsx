'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import TurnoPanel from '@/app/components/Parking/Estadias/TurnoPanel';
import SalidaEstadia from '@/app/components/Parking/Estadias/SalidaEstadia';
import CajaPendientesDrawerV2 from '@/app/components/Parking/Caja/CajaPendientesDrawerV2';
import CajaLiquidacionPendienteV2 from '@/app/components/Parking/Caja/CajaLiquidacionPendienteV2';
import TurnoEventsTable from '@/modules/turnos/components/TurnoEventsTable';
import CajaFacturacionAbonadosTab from '@/modules/caja/components/CajaFacturacionAbonadosTab';
import type { TurnoCaja } from '@/modules/caja/types/caja.types';
import { useTurno } from '@/app/hooks/Parking/Caja/useTurno';
import {
  cerrarPendiente,
  cerrarSubturno,
  liquidarSubturno,
  obtenerPendientes,
} from '@/modules/turnos/services/subturnos.service';
import { abrirTurno as abrirTurnoService } from '@/modules/caja/services/caja.service';
import { useTurno as useTurnoContext } from '@/app/context/TurnoContext';

interface CajaDashboardV2Props {
  nombreEstacionamiento?: string;
}

type CajaView = 'operacion' | 'facturacion' | 'pendientes' | 'liquidacion' | 'vacio';

type OperacionTab = 'operacion' | 'facturacion' | 'eventos';

export default function CajaDashboardV2({
  nombreEstacionamiento = 'Estacionamiento',
}: CajaDashboardV2Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const operatorId = session?.user?.id ?? '';
  const { parkinglotId } = useTurnoContext();

  const { turno } = useTurno(operatorId);

  const [pendientes, setPendientes] = useState<TurnoCaja[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPendiente, setSelectedPendiente] = useState<TurnoCaja | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [turnoAbiertoLocal, setTurnoAbiertoLocal] = useState(false);
  const [operacionTab, setOperacionTab] = useState<OperacionTab>('operacion');

  const liquidacionRef = useRef<HTMLDivElement>(null);

  const turnoAbiertoDesdeServer = Boolean(turno && turno.estado === 'abierto');
  const hayTurnoAbierto = turnoAbiertoLocal || turnoAbiertoDesdeServer;
  const pendientesCount = pendientes.length;

  useEffect(() => {
    if (turnoAbiertoDesdeServer) {
      setTurnoAbiertoLocal(true);
    }
  }, [turnoAbiertoDesdeServer]);

  const currentView: CajaView = useMemo(() => {
    if (selectedPendiente) return 'liquidacion';
    if (hayTurnoAbierto) return operacionTab === 'facturacion' ? 'facturacion' : 'operacion';
    if (pendientesCount > 0) return 'pendientes';
    return 'vacio';
  }, [selectedPendiente, hayTurnoAbierto, pendientesCount, operacionTab]);

  const refreshPendientes = useCallback(async () => {
    if (!operatorId) {
      setPendientes([]);
      return [];
    }

    try {
      const result = await obtenerPendientes(operatorId);
      setPendientes(result);
      return result;
    } catch {
      setPendientes([]);
      return [];
    }
  }, [operatorId]);

  const refreshAll = useCallback(async () => {
    await refreshPendientes();
    setRefreshKey((prev) => prev + 1);
    router.refresh();
  }, [refreshPendientes, router]);

  useEffect(() => {
    void refreshPendientes();
  }, [refreshPendientes, refreshKey]);

  if (!operatorId) {
    return (
      <section className="dashboard-section border-red-200 bg-red-50 p-6">
        <h2 className="text-xl font-bold text-red-700">Operador no autenticado</h2>
        <p className="mt-2 text-sm text-red-600">Debés iniciar sesión para operar caja.</p>
      </section>
    );
  }

  const irALiquidacion = (turnoSeleccionado: TurnoCaja) => {
    setSelectedPendiente(turnoSeleccionado);
    setDrawerOpen(false);
    setError(null);

    window.setTimeout(() => {
      liquidacionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 100);
  };

  const handleAbrirTurno = async () => {
    try {
      setLoading(true);
      setError(null);
      await abrirTurnoService(operatorId);
      setTurnoAbiertoLocal(true);
      setSelectedPendiente(null);
      setDrawerOpen(false);
      await refreshAll();
    } catch (err) {
      setTurnoAbiertoLocal(false);
      setError(err instanceof Error ? err.message : 'Error abriendo turno');
    } finally {
      setLoading(false);
    }
  };

  const handleCerrarSubturno = async () => {
    if (!hayTurnoAbierto) return;

    try {
      setLoading(true);
      setError(null);
      await cerrarSubturno(operatorId);
      setTurnoAbiertoLocal(false);
      setSelectedPendiente(null);
      setDrawerOpen(false);
      const nuevosPendientes = await refreshPendientes();
      setRefreshKey((prev) => prev + 1);
      router.refresh();
      if (nuevosPendientes.length > 0) setDrawerOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cerrando subturno');
    } finally {
      setLoading(false);
    }
  };

  const handleCerrarTurno = async () => {
    if (!hayTurnoAbierto) return;

    try {
      setLoading(true);
      setError(null);
      const turnoCerrado = await cerrarSubturno(operatorId);
      setTurnoAbiertoLocal(false);
      setDrawerOpen(false);
      const nuevosPendientes = await refreshPendientes();
      setRefreshKey((prev) => prev + 1);
      router.refresh();
      const recienCerrado = nuevosPendientes.find((item) => item._id === turnoCerrado._id) ?? turnoCerrado;
      irALiquidacion(recienCerrado);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cerrando turno');
    } finally {
      setLoading(false);
    }
  };

  const handleLiquidarPendiente = async (payload: {
    efectivo: number;
    tarjeta: number;
    otros: number;
    observacion?: string;
  }) => {
    if (!selectedPendiente) return;

    try {
      setLoading(true);
      setError(null);
      const updated = await liquidarSubturno(operatorId, selectedPendiente._id, payload);
      setSelectedPendiente(updated);
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error liquidando subturno');
    } finally {
      setLoading(false);
    }
  };

  const handleCerrarPendiente = async () => {
    if (!selectedPendiente) return;

    try {
      setLoading(true);
      setError(null);
      const turnoId = selectedPendiente._id;
      await cerrarPendiente(operatorId, turnoId);
      const shouldPrint = window.confirm('Subturno cerrado. ¿Deseás imprimir/guardar el reporte ahora?');
      if (shouldPrint) {
        window.open(`/api/v2/turno/${turnoId}/reporte`, '_blank', 'noopener,noreferrer');
      }
      setSelectedPendiente(null);
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cerrando subturno');
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirPendientes = () => {
    setDrawerOpen(true);
    setError(null);
  };

  const handleVolverPendientes = () => {
    setSelectedPendiente(null);
    setError(null);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      {(hayTurnoAbierto || pendientesCount > 0) && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
            {hayTurnoAbierto && (
              <>
                <button
                  onClick={() => void handleCerrarSubturno()}
                  disabled={loading}
                  className="rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cerrar subturno
                </button>

                <button
                  onClick={() => void handleCerrarTurno()}
                  disabled={loading}
                  className="rounded-xl border border-gray-300 bg-gray-200 px-5 py-3 font-semibold text-gray-800 transition hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cerrar turno
                </button>
              </>
            )}

            {pendientesCount > 0 && (
              <button
                onClick={handleAbrirPendientes}
                className="rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Pendientes de liquidación ({pendientesCount})
              </button>
            )}
          </div>

          {hayTurnoAbierto && (
            <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
              <button
                onClick={() => setOperacionTab('operacion')}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold ${operacionTab === 'operacion' ? 'border-gray-300 bg-gray-200 text-gray-900' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                Operación
              </button>
              <button
                onClick={() => setOperacionTab('facturacion')}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold ${operacionTab === 'facturacion' ? 'border-gray-300 bg-gray-200 text-gray-900' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                Facturación
              </button>
              <button
                onClick={() => setOperacionTab('eventos')}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold ${operacionTab === 'eventos' ? 'border-gray-300 bg-gray-200 text-gray-900' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                Eventos
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <section className="dashboard-section border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">{error}</p>
        </section>
      )}

      {currentView === 'operacion' && hayTurnoAbierto && operacionTab === 'operacion' && (
        <div className="space-y-6">
          <TurnoPanel
            key={`turno-panel-${refreshKey}-${operatorId}`}
            operatorId={operatorId}
            renderIngresosSalidas={() => (
              <SalidaEstadia
                nombreEstacionamiento={nombreEstacionamiento}
                refresh={() => {
                  void refreshAll();
                }}
              />
            )}
          />
        </div>
      )}

      {currentView === 'facturacion' && hayTurnoAbierto && operacionTab === 'facturacion' && (
        <CajaFacturacionAbonadosTab
          operatorId={operatorId}
          parkinglotId={parkinglotId}
          turno={turno ?? null}
          loading={loading}
          onRefresh={refreshAll}
        />
      )}

      {hayTurnoAbierto && operacionTab === 'eventos' && (
        <TurnoEventsTable />
      )}

      {currentView === 'vacio' && (
        <section className="dashboard-section p-8 md:p-10">
          <h2 className="text-xl font-bold text-gray-900">Caja sin turno activo</h2>
          <p className="mt-2 text-sm text-gray-500">
            Abrí un turno para comenzar a operar cobros y cierres.
          </p>

          <div className="mt-6">
            <button
              onClick={() => void handleAbrirTurno()}
              disabled={loading}
              className="rounded-xl bg-gray-900 px-5 py-3 font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Abriendo caja...' : 'Abrir turno / ir a caja'}
            </button>
          </div>
        </section>
      )}

      {currentView === 'pendientes' && !selectedPendiente && pendientesCount > 0 && (
        <section className="dashboard-section p-8 md:p-10">
          <h2 className="text-xl font-bold text-gray-900">Pendientes de liquidación</h2>
          <p className="mt-2 text-sm text-gray-500">
            Seleccioná un subturno pendiente para liquidarlo y cerrarlo.
          </p>

          <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6">
            <p className="text-sm text-gray-700">
              Tenés <strong>{pendientesCount}</strong> subturno(s) pendiente(s). Abrí el panel para continuar con la liquidación.
            </p>
          </div>
        </section>
      )}

      {currentView === 'liquidacion' && selectedPendiente && (
        <div ref={liquidacionRef}>
          <CajaLiquidacionPendienteV2
            turno={selectedPendiente}
            loading={loading}
            error={error}
            onLiquidar={handleLiquidarPendiente}
            onCerrar={handleCerrarPendiente}
            onVolver={handleVolverPendientes}
          />
        </div>
      )}

      <CajaPendientesDrawerV2 open={drawerOpen} onClose={() => setDrawerOpen(false)} pendientes={pendientes} onSelect={irALiquidacion} />
    </div>
  );
}
