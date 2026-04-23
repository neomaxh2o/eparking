'use client';

import { useEffect, useMemo, useState } from 'react';
import { Tab } from '@headlessui/react';
import BillingDocumentsList from '@/modules/billing/components/BillingDocumentsList';
import type { BillingDocument } from '@/modules/billing/types/billing.types';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function PanelFlujoOperativo() {
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [parkings, setParkings] = useState<any[]>([]);
  const [loadingParkings, setLoadingParkings] = useState(true);
  const [parkinglotId, setParkinglotId] = useState('');
  const [cajaNumero, setCajaNumero] = useState('');
  const [cajasDisponibles, setCajasDisponibles] = useState<Array<{ numero: number }>>([]);
  const [adminCashTurno, setAdminCashTurno] = useState<any | null>(null);
  const [loadingAdminCash, setLoadingAdminCash] = useState(false);
  const [documents, setDocuments] = useState<BillingDocument[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchBillingParkings = async () => {
    try {
      setLoadingParkings(true);
      const res = await fetch('/api/v2/billing/parkings');
      const data = await res.json();
      setParkings(Array.isArray(data) ? data : []);
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
      const arr = Array.isArray(data) ? data : [];
      setCajasDisponibles(arr);
      if (arr.length > 0) setCajaNumero((prev) => prev || String(arr[0].numero));
    } catch {
      setCajasDisponibles([]);
    }
  };

  const fetchAdminCashTurno = async (nextParkinglotId?: string) => {
    try {
      setLoadingAdminCash(true);
      const params = new URLSearchParams();
      if (nextParkinglotId) params.set('parkinglotId', nextParkinglotId);
      const res = await fetch(`/api/v2/billing/admin-cash${params.toString() ? `?${params.toString()}` : ''}`);
      const data = await res.json();
      setAdminCashTurno(data?.turno ?? null);
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
    void fetchCajasDisponibles(parkinglotId || undefined);
    void fetchAdminCashTurno(parkinglotId || undefined);
    void fetchDocuments(parkinglotId || undefined);
    setMessage(null);
    setError(null);
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
    if (!cajaNumero) return setError('Seleccioná una caja para abrir la caja administrativa.');

    try {
      setError(null);
      setMessage(null);
      const res = await fetch('/api/v2/billing/admin-cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parkinglotId, cajaNumero }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo abrir la caja administrativa');
      await fetchAdminCashTurno(parkinglotId || undefined);
      setMessage('Jornada iniciada: caja administrativa abierta correctamente.');
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    }
  };

  const cerrarCajaAdministrativa = async () => {
    if (!adminCashTurno?._id) return setError('No hay una caja administrativa abierta para cerrar.');

    try {
      setError(null);
      setMessage(null);
      const res = await fetch('/api/v2/billing/admin-cash', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ turnoId: adminCashTurno._id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo cerrar la caja administrativa');
      await fetchAdminCashTurno(parkinglotId || undefined);
      setMessage('Caja administrativa cerrada correctamente.');
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    }
  };

  const marcarDocumento = async (documentId: string, estado: 'pagada' | 'vencida' | 'cancelada') => {
    try {
      setError(null);
      setMessage(null);
      const res = await fetch(`/api/v2/billing/documents/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar el documento');
      setMessage(`Documento actualizado a ${estado}.`);
      await fetchDocuments(parkinglotId || undefined);
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    }
  };

  const acreditarDocumento = async (documentId: string) => {
    try {
      setError(null);
      setMessage(null);
      if (!adminCashTurno?._id) throw new Error('Abrí la caja administrativa desde Inicio de jornada antes de acreditar cobros.');
      const res = await fetch(`/api/v2/billing/documents/${documentId}/acreditar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentProvider: 'electronic', paymentMethod: 'electronic', adminCashTurnoId: adminCashTurno._id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo acreditar el pago');
      setMessage('Pago acreditado correctamente.');
      await fetchDocuments(parkinglotId || undefined);
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    }
  };

  return (
    <div className="space-y-6">
      <div className="dashboard-section p-5 md:p-6 space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Flujo Operativo</h2>
          <p className="mt-1 text-sm text-gray-500">Contexto diario de operación. La caja activa deja de ser destino visible y pasa a ser estado operativo.</p>
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
                <select value={parkinglotId} onChange={(e) => setParkinglotId(e.target.value)} className="rounded-xl border border-gray-300 bg-white px-4 py-3" disabled={loadingParkings}>
                  <option value="">Seleccionar playa operativa</option>
                  {parkings.map((parking) => <option key={parking._id} value={parking._id}>{parking.name}</option>)}
                </select>
                {cajasDisponibles.length > 0 ? (
                  <select value={cajaNumero} onChange={(e) => setCajaNumero(e.target.value)} className="rounded-xl border border-gray-300 bg-white px-4 py-3">
                    <option value="">Seleccionar caja</option>
                    {cajasDisponibles.map((caja) => <option key={caja.numero} value={String(caja.numero)}>Caja {caja.numero}</option>)}
                  </select>
                ) : (
                  <input type="number" min="1" value={cajaNumero} onChange={(e) => setCajaNumero(e.target.value)} placeholder="Número de caja" className="rounded-xl border border-gray-300 px-4 py-3" />
                )}
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => void abrirCajaAdministrativa()} className="rounded-xl border border-gray-300 bg-gray-200 px-5 py-3 font-semibold text-gray-800 hover:bg-gray-300">Abrir caja</button>
                  <button onClick={() => void cerrarCajaAdministrativa()} className="rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50">Cerrar caja</button>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 space-y-2">
                <p className="font-semibold text-gray-900">Estado operativo actual</p>
                {loadingAdminCash ? <p>Cargando estado operativo...</p> : adminCashTurno ? (
                  <>
                    <p><strong>Estado:</strong> Caja administrativa abierta</p>
                    <p><strong>Turno:</strong> {adminCashTurno._id}</p>
                    <p><strong>Playa:</strong> {adminCashTurno.assignedParking || adminCashTurno.parkinglotId || '-'}</p>
                    <p><strong>Caja:</strong> {adminCashTurno.numeroCaja ?? adminCashTurno.cajaNumero ?? '-'}</p>
                  </>
                ) : (
                  <p>Sin caja administrativa abierta para la playa seleccionada.</p>
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

              <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
                Vista operativa acotada por playa. La gestión completa de facturas, abonados, conciliación y cierres vive en <strong>Facturación</strong>.
              </div>

              {loadingDocuments ? <p className="text-sm text-gray-500">Cargando documentos de la playa...</p> : null}
              {!parkinglotId ? <p className="text-sm text-gray-500">Seleccioná una playa para ver su workbench operativo de documentos.</p> : null}
              {parkinglotId && !documents.length ? <p className="text-sm text-gray-500">No hay documentos para la playa seleccionada.</p> : null}
              {parkinglotId && documents.length ? (
                <BillingDocumentsList
                  billingDocumentsByPeriod={documentosByPeriod}
                  acreditarDocumento={acreditarDocumento}
                  marcarDocumento={marcarDocumento}
                />
              ) : null}
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
}
