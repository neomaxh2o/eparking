'use client';

import { useEffect, useMemo, useState } from 'react';
import { Tab } from '@headlessui/react';
import BillingDocumentsList from '@/modules/billing/components/BillingDocumentsList';
import type { BillingDocument } from '@/modules/billing/types/billing.types';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

function formatMoney(value?: number | null) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

function formatDate(value?: string | Date | null) {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
}

type AdminCashTurno = {
  _id?: string;
  assignedParking?: string;
  parkinglotId?: string;
  numeroCaja?: number | null;
  cajaNumero?: number | null;
  fechaApertura?: string;
  fechaCierre?: string;
  estado?: string;
  totalTurno?: number;
  liquidacion?: {
    fechaLiquidacion?: string;
    totalSistema?: number;
    totalDeclarado?: number;
    diferencia?: number;
    observacion?: string;
  };
};

type TurnoLiquidacionSnapshot = {
  turnoId?: string;
  cajaNumero?: number | null;
  fechaApertura?: string;
  fechaCierre?: string;
  cantidadTickets?: number;
  cantidadOperaciones?: number;
  totalEfectivo?: number;
  totalTransferencia?: number;
  totalTarjeta?: number;
  totalOtros?: number;
  totalIngresos?: number;
  totalEgresos?: number;
  saldoTeorico?: number;
  saldoDeclarado?: number;
  diferenciaCaja?: number;
  observaciones?: string;
  updatedAt?: string;
};

type ParkingOption = {
  _id: string;
  name: string;
};

type CajaOption = {
  _id: string;
  parkinglotId: string;
  numero: number;
  code?: string;
  displayName?: string;
  tipo?: string;
  activa?: boolean;
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function PanelFlujoOperativo() {
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [parkings, setParkings] = useState<ParkingOption[]>([]);
  const [loadingParkings, setLoadingParkings] = useState(true);
  const [parkinglotId, setParkinglotId] = useState('');
  const [cajaNumero, setCajaNumero] = useState('');
  const [cajasDisponibles, setCajasDisponibles] = useState<CajaOption[]>([]);
  const [adminCashTurno, setAdminCashTurno] = useState<AdminCashTurno | null>(null);
  const [lastClosedTurno, setLastClosedTurno] = useState<AdminCashTurno | null>(null);
  const [lastLiquidacion, setLastLiquidacion] = useState<TurnoLiquidacionSnapshot | null>(null);
  const [loadingAdminCash, setLoadingAdminCash] = useState(false);
  const [openingCaja, setOpeningCaja] = useState(false);
  const [liquidatingCaja, setLiquidatingCaja] = useState(false);
  const [documents, setDocuments] = useState<BillingDocument[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const turnoAbierto = Boolean(adminCashTurno?._id);
  const cajaCount = cajasDisponibles.length;
  const selectedCaja = useMemo(
    () => cajasDisponibles.find((caja) => String(caja.numero) === cajaNumero) ?? null,
    [cajaNumero, cajasDisponibles],
  );
  const hasCajaConfig = cajaCount > 0;
  const canOpenCaja = Boolean(parkinglotId) && Boolean(cajaNumero) && !turnoAbierto && !openingCaja && hasCajaConfig;
  const canLiquidarCaja = Boolean(adminCashTurno?._id) && !liquidatingCaja;

  const fetchBillingParkings = async () => {
    try {
      setLoadingParkings(true);
      const res = await fetch('/api/v2/billing/parkings');
      const data = await res.json();
      const nextParkings = Array.isArray(data) ? data : [];
      setParkings(nextParkings);
      setParkinglotId((current) => current || String(nextParkings[0]?._id ?? ''));
    } catch {
      setParkings([]);
    } finally {
      setLoadingParkings(false);
    }
  };

  const fetchCajasDisponibles = async (nextParkinglotId?: string) => {
    try {
      const params = new URLSearchParams();
      if (nextParkinglotId) params.set('parkinglotId', nextParkinglotId);
      const res = await fetch(`/api/v2/billing/cajas?${params.toString()}`);
      const data = await res.json();
      const arr = Array.isArray(data) ? (data as CajaOption[]) : [];
      setCajasDisponibles(arr);
      setCajaNumero((prev) => {
        if (!arr.length) return '';
        if (prev && arr.some((caja) => String(caja.numero) === prev)) return prev;
        if (arr.length === 1) return String(arr[0].numero);
        return '';
      });
    } catch {
      setCajasDisponibles([]);
      setCajaNumero('');
    }
  };

  const fetchAdminCashTurno = async (nextParkinglotId?: string) => {
    try {
      setLoadingAdminCash(true);
      const params = new URLSearchParams();
      if (nextParkinglotId) params.set('parkinglotId', nextParkinglotId);
      const res = await fetch(`/api/v2/billing/admin-cash${params.toString() ? `?${params.toString()}` : ''}`);
      const data = await res.json();
      const turno = data?.turno ?? null;
      setAdminCashTurno(turno);
      if (turno?._id) {
        setLastClosedTurno(null);
        setLastLiquidacion(null);
      }
    } catch {
      setAdminCashTurno(null);
    } finally {
      setLoadingAdminCash(false);
    }
  };

  const fetchDocuments = async (nextParkinglotId?: string) => {
    try {
      setLoadingDocuments(true);
      const params = new URLSearchParams();
      if (nextParkinglotId) params.set('parkinglotId', nextParkinglotId);
      const res = await fetch(`/api/v2/billing/documents${params.toString() ? `?${params.toString()}` : ''}`);
      const data = await res.json();
      setDocuments(Array.isArray(data) ? (data as BillingDocument[]) : []);
    } catch {
      setDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  };

  useEffect(() => {
    void fetchBillingParkings();
  }, []);

  useEffect(() => {
    setCajaNumero('');

    if (!parkinglotId) {
      setCajasDisponibles([]);
      setAdminCashTurno(null);
      setLastClosedTurno(null);
      setLastLiquidacion(null);
      setDocuments([]);
      return;
    }

    void fetchCajasDisponibles(parkinglotId);
    void fetchAdminCashTurno(parkinglotId);
    void fetchDocuments(parkinglotId);
    setMessage(null);
    setError(null);
    setLastClosedTurno(null);
    setLastLiquidacion(null);
  }, [parkinglotId]);

  const documentosByPeriod = useMemo(() => {
    return documents.reduce((acc, doc) => {
      const periodo = doc.periodoLabel || 'Sin período';
      if (!acc[periodo]) acc[periodo] = [];
      acc[periodo].push(doc);
      return acc;
    }, {} as Record<string, BillingDocument[]>);
  }, [documents]);

  const counters = useMemo(() => ({
    pendientes: documents.filter((d) => d.estado === 'pendiente' || d.estado === 'emitida').length,
    vencidos: documents.filter((d) => d.estado === 'vencida').length,
    pagados: documents.filter((d) => d.estado === 'pagada').length,
  }), [documents]);

  const abrirCajaAdministrativa = async () => {
    if (!parkinglotId) return setError('Seleccioná una playa para iniciar la jornada.');
    if (!cajasDisponibles.length) return setError('La playa seleccionada no tiene cajas activas configuradas para este flujo.');
    if (!cajaNumero) return setError(cajasDisponibles.length > 1 ? 'Seleccioná una caja para abrir el turno administrativo.' : 'No hay una caja válida disponible para abrir el turno administrativo.');

    try {
      setOpeningCaja(true);
      setError(null);
      setMessage(null);
      const res = await fetch('/api/v2/billing/admin-cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parkinglotId, cajaNumero: Number(cajaNumero) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo abrir la caja administrativa');
      setAdminCashTurno(data?.turno ?? null);
      setLastClosedTurno(null);
      setLastLiquidacion(null);
      setMessage('Jornada iniciada: caja/turno administrativo abierto correctamente.');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Error desconocido'));
    } finally {
      setOpeningCaja(false);
    }
  };

  const liquidarCajaAdministrativa = async () => {
    if (!adminCashTurno?._id) return setError('No hay un turno administrativo abierto para liquidar.');

    try {
      setLiquidatingCaja(true);
      setError(null);
      setMessage(null);
      const res = await fetch('/api/v2/turno/liquidar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turnoId: adminCashTurno._id,
          observacion: 'Liquidación/cierre administrativo desde Flujo Operativo',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo liquidar el turno administrativo');

      setAdminCashTurno(null);
      setLastClosedTurno((data?.turno ?? null) as AdminCashTurno | null);
      setLastLiquidacion((data?.liquidacion ?? null) as TurnoLiquidacionSnapshot | null);
      setMessage('Turno liquidado y cerrado correctamente. Ya podés reabrir una nueva caja en la misma playa cuando corresponda.');
      await fetchDocuments(parkinglotId || undefined);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Error desconocido'));
    } finally {
      setLiquidatingCaja(false);
    }
  };

  const marcarDocumento = async (documentId: string, estado: 'pagada' | 'vencida' | 'cancelada') => {
    try {
      setError(null);
      setMessage(null);
      const payload: Record<string, unknown> = { estado };
      if (estado === 'pagada') {
        if (!adminCashTurno?._id) throw new Error('Abrí un turno administrativo antes de marcar cobros como pagados.');
        payload.adminCashTurnoId = adminCashTurno._id;
      }
      const res = await fetch(`/api/v2/billing/documents/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar el documento');
      setMessage(`Documento actualizado a ${estado}.`);
      await fetchDocuments(parkinglotId || undefined);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Error desconocido'));
    }
  };

  const acreditarDocumento = async (documentId: string) => {
    try {
      setError(null);
      setMessage(null);
      if (!adminCashTurno?._id) throw new Error('Abrí el turno administrativo desde Inicio de jornada antes de acreditar cobros.');
      const res = await fetch(`/api/v2/billing/documents/${documentId}/acreditar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentProvider: 'electronic', paymentMethod: 'electronic', adminCashTurnoId: adminCashTurno._id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo acreditar el pago');
      setMessage('Pago acreditado correctamente.');
      await fetchDocuments(parkinglotId || undefined);
      await fetchAdminCashTurno(parkinglotId || undefined);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Error desconocido'));
    }
  };

  const activeParkingName = useMemo(
    () => parkings.find((parking) => String(parking._id) === String(parkinglotId))?.name ?? '-',
    [parkings, parkinglotId],
  );

  const visibleLiquidacion = lastLiquidacion;

  return (
    <div className="space-y-6">
      <div className="dashboard-section p-5 md:p-6 space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Flujo Operativo</h2>
          <p className="mt-1 text-sm text-gray-500">Inicio, operación y cierre de la jornada administrativa desde la UI activa.</p>
        </div>

        {message ? <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">{message}</div> : null}
        {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

        <Tab.Group selectedIndex={selectedTabIndex} onChange={setSelectedTabIndex}>
          <Tab.List className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
            {['Inicio de jornada', 'Documentos de playa'].map((tab) => (
              <Tab
                key={tab}
                className={({ selected }) => classNames(
                  'inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition',
                  selected ? 'border-gray-300 bg-gray-200 text-gray-800' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
                )}
              >
                {tab}
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels className="mt-6 space-y-6">
            <Tab.Panel className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <select value={parkinglotId} onChange={(e) => setParkinglotId(e.target.value)} className="rounded-xl border border-gray-300 bg-white px-4 py-3" disabled={loadingParkings || openingCaja || liquidatingCaja || turnoAbierto}>
                  <option value="">Seleccionar playa operativa</option>
                  {parkings.map((parking) => <option key={parking._id} value={parking._id}>{parking.name}</option>)}
                </select>
                {!parkinglotId ? (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                    Seleccioná una playa para ver sus cajas administrativas activas.
                  </div>
                ) : cajaCount === 0 ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    Esta playa no tiene cajas activas configuradas para el flujo administrativo.
                  </div>
                ) : cajaCount === 1 ? (
                  <div className="rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    <p className="font-semibold text-gray-900">Caja asignada automáticamente</p>
                    <p>{selectedCaja?.displayName || `Caja ${selectedCaja?.numero ?? cajaNumero}`}</p>
                    <p className="text-xs text-gray-500">Tipo: {selectedCaja?.tipo || 'administrativa'} · N° {selectedCaja?.numero ?? '-'}</p>
                  </div>
                ) : (
                  <select value={cajaNumero} onChange={(e) => setCajaNumero(e.target.value)} className="rounded-xl border border-gray-300 bg-white px-4 py-3" disabled={turnoAbierto || openingCaja || liquidatingCaja}>
                    <option value="">Seleccionar caja</option>
                    {cajasDisponibles.map((caja) => <option key={caja._id || caja.numero} value={String(caja.numero)}>{caja.displayName || `Caja ${caja.numero}`} · {caja.tipo || 'operativa'}</option>)}
                  </select>
                )}
                <div className="flex flex-wrap gap-3">
                  {!turnoAbierto ? (
                    <button onClick={() => void abrirCajaAdministrativa()} disabled={!canOpenCaja} className="rounded-xl border border-gray-300 bg-gray-200 px-5 py-3 font-semibold text-gray-800 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50">
                      {openingCaja ? 'Abriendo...' : 'Abrir caja/turno'}
                    </button>
                  ) : null}
                  <button onClick={() => void liquidarCajaAdministrativa()} disabled={!canLiquidarCaja} className="rounded-xl border border-emerald-300 bg-emerald-50 px-5 py-3 font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50">
                    {liquidatingCaja ? 'Liquidando...' : 'Liquidar y cerrar'}
                  </button>
                </div>
              </div>

              {!turnoAbierto && parkinglotId && cajaCount > 1 && !cajaNumero ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  Esta playa tiene múltiples cajas activas. Seleccioná una antes de iniciar la jornada administrativa.
                </div>
              ) : null}
              {!turnoAbierto && parkinglotId && cajaCount === 0 ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  No se puede abrir el turno administrativo porque la playa seleccionada no tiene cajas activas disponibles.
                </div>
              ) : null}

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 space-y-3">
                <p className="font-semibold text-gray-900">Estado operativo actual</p>
                {loadingAdminCash ? <p>Cargando estado operativo...</p> : turnoAbierto ? (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div><strong>Estado:</strong> Turno abierto</div>
                    <div><strong>Playa:</strong> {activeParkingName}</div>
                    <div><strong>Turno:</strong> {adminCashTurno?._id || '-'}</div>
                    <div><strong>Caja:</strong> {adminCashTurno?.numeroCaja ?? adminCashTurno?.cajaNumero ?? '-'}</div>
                    <div><strong>Apertura:</strong> {formatDate(adminCashTurno?.fechaApertura)}</div>
                    <div><strong>Total operativo:</strong> {formatMoney(adminCashTurno?.totalTurno)}</div>
                    <div className="md:col-span-2 xl:col-span-2"><strong>Acción disponible:</strong> solo Liquidar y cerrar para este turno abierto.</div>
                  </div>
                ) : visibleLiquidacion && lastClosedTurno ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <div><strong>Estado:</strong> Turno liquidado / cerrado</div>
                      <div><strong>Playa:</strong> {activeParkingName}</div>
                      <div><strong>Turno:</strong> {lastClosedTurno._id || visibleLiquidacion.turnoId || '-'}</div>
                      <div><strong>Caja:</strong> {lastClosedTurno.numeroCaja ?? lastClosedTurno.cajaNumero ?? visibleLiquidacion.cajaNumero ?? '-'}</div>
                      <div><strong>Apertura:</strong> {formatDate(visibleLiquidacion.fechaApertura || lastClosedTurno.fechaApertura)}</div>
                      <div><strong>Cierre:</strong> {formatDate(visibleLiquidacion.fechaCierre || lastClosedTurno.fechaCierre || lastClosedTurno.liquidacion?.fechaLiquidacion)}</div>
                      <div><strong>Saldo teórico:</strong> {formatMoney(visibleLiquidacion.saldoTeorico ?? lastClosedTurno.totalTurno)}</div>
                      <div><strong>Diferencia:</strong> {formatMoney(visibleLiquidacion.diferenciaCaja ?? lastClosedTurno.liquidacion?.diferencia)}</div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
                      <div><strong>Tickets:</strong> {visibleLiquidacion.cantidadTickets ?? 0}</div>
                      <div><strong>Operaciones:</strong> {visibleLiquidacion.cantidadOperaciones ?? 0}</div>
                      <div><strong>Efectivo:</strong> {formatMoney(visibleLiquidacion.totalEfectivo)}</div>
                      <div><strong>Transferencia:</strong> {formatMoney(visibleLiquidacion.totalTransferencia)}</div>
                      <div><strong>Tarjeta:</strong> {formatMoney(visibleLiquidacion.totalTarjeta)}</div>
                      <div><strong>Otros:</strong> {formatMoney(visibleLiquidacion.totalOtros)}</div>
                    </div>
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-blue-800">
                      El turno quedó cerrado. Para continuar operando en esta misma playa, abrí un nuevo caja/turno.
                    </div>
                  </div>
                ) : (
                  <p>Sin caja administrativa abierta para la playa seleccionada. Podés abrir una nueva para comenzar o reanudar la jornada.</p>
                )}
              </div>
            </Tab.Panel>

            <Tab.Panel className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <select value={parkinglotId} onChange={(e) => setParkinglotId(e.target.value)} className="rounded-xl border border-gray-300 bg-white px-4 py-3" disabled={loadingParkings}>
                  <option value="">Seleccionar playa</option>
                  {parkings.map((parking) => <option key={parking._id} value={parking._id}>{parking.name}</option>)}
                </select>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Pendientes</p><p className="mt-2 text-2xl font-bold text-gray-900">{counters.pendientes}</p></div>
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><p className="text-xs font-semibold uppercase tracking-wide text-red-600">Vencidos</p><p className="mt-2 text-2xl font-bold">{counters.vencidos}</p></div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Pagados</p><p className="mt-2 text-2xl font-bold">{counters.pagados}</p></div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600 space-y-2">
                <p>
                  Vista operativa acotada por playa. Las acreditaciones y marcas de cobro usan el <strong>turno administrativo activo</strong>.
                </p>
                {!turnoAbierto ? (
                  <p className="text-amber-700">No hay turno abierto: se puede consultar, pero las acciones que acreditan o marcan cobros operativos quedan bloqueadas.</p>
                ) : null}
              </div>

              {loadingDocuments ? <p className="text-sm text-gray-500">Cargando documentos de la playa...</p> : null}
              {!parkinglotId ? <p className="text-sm text-gray-500">Seleccioná una playa para ver su workbench operativo de documentos.</p> : null}
              {parkinglotId && !documents.length ? <p className="text-sm text-gray-500">No hay documentos para la playa seleccionada.</p> : null}
              {parkinglotId && documents.length ? (
                <BillingDocumentsList
                  billingDocumentsByPeriod={documentosByPeriod}
                  acreditarDocumento={turnoAbierto ? acreditarDocumento : async () => setError('Abrí un turno administrativo antes de acreditar cobros.')}
                  marcarDocumento={async (documentId, estado) => {
                    if (!turnoAbierto && estado === 'pagada') {
                      setError('Abrí un turno administrativo antes de marcar cobros como pagados.');
                      return;
                    }
                    await marcarDocumento(documentId, estado);
                  }}
                />
              ) : null}
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
}
