'use client';

import { useEffect, useMemo, useState } from 'react';
import OpenTurnoWidget from './OpenTurnoWidget';
import FinancialOperationsMock from './FinancialOperationsMock';
import { Tab } from '@headlessui/react';
import BillingDocumentsList from '@/modules/billing/components/BillingDocumentsList';
import ParkingBillingProfileQuickEditor from '@/modules/billing/components/ParkingBillingProfileQuickEditor';
import type { BillingDocument } from '@/modules/billing/types/billing.types';
import BillingControls from './BillingControls';
import { useOwnerOperations } from '@/app/components/AdminPanel/OwnerOperationsContext';
import {
  fetchCajasDisponibles as sharedFetchCajasDisponibles,
  resolveCajaFallback as sharedResolveCajaFallback,
  toCents as sharedToCents,
  fromCents as sharedFromCents,
  logger as sharedLogger,
} from '@/modules/turnos/shared/index';


function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function PanelFacturacion() {
  const ownerOperations = useOwnerOperations();
  const operationalState = ownerOperations?.operationalState || 'pre-operativo';
  const isOperationalActive = operationalState === 'operativo';
  const OPERATIONS_ENABLED = (typeof process !== 'undefined' && process?.env?.NEXT_PUBLIC_ADMIN_OPERATIONS_ENABLED === 'true') || Boolean(ownerOperations);
  if (!OPERATIONS_ENABLED) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-700">
          <h3 className="text-lg font-bold">Abrir turno</h3>
          <p className="mt-2 text-sm text-gray-500">La sección operativa principal está deshabilitada. Usá el formulario de abajo para abrir un turno.</p>
        </div>
        <OpenTurnoWidget />
        <FinancialOperationsMock />
      </div>
    );
  }
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [parkings, setParkings] = useState<any[]>([]);
  const [loadingParkings, setLoadingParkings] = useState(true);
  const [billingDocuments, setBillingDocuments] = useState<BillingDocument[]>([]);
  const [closures, setClosures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingClosures, setLoadingClosures] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('');
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState('');
  const [invoiceSourceFilter, setInvoiceSourceFilter] = useState('');
  const [fiscalSourceFilter, setFiscalSourceFilter] = useState('');
  const [fiscalStatusFilter, setFiscalStatusFilter] = useState('');
  const [financialRunSummary, setFinancialRunSummary] = useState<any | null>(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [reconcileSummary, setReconcileSummary] = useState<any | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const publishStatus = (type: 'success' | 'error' | 'info', text: string | null) => {
    if (ownerOperations?.setStatusMessage) {
      ownerOperations.setStatusMessage(text ? { type, text } : null);
    }
    setMessage(text);
  };
  const [closureMessage, setClosureMessage] = useState<string | null>(null);
  const [selectedClosure, setSelectedClosure] = useState<any | null>(null);
  const [parkinglotId, setParkinglotId] = useState('');
  const [cajaNumero, setCajaNumero] = useState('');
  const [closureFrom, setClosureFrom] = useState('');
  const [closureTo, setClosureTo] = useState('');
  const [cajasDisponibles, setCajasDisponibles] = useState<Array<{ numero: number }>>([]);
  const [selectedParkingBillingProfile, setSelectedParkingBillingProfile] = useState<any | null>(null);
  const [loadingParkingBillingProfile, setLoadingParkingBillingProfile] = useState(false);
  const [isQuickFiscalEditorOpen, setIsQuickFiscalEditorOpen] = useState(false);

  if (!isOperationalActive) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-700">
          <h3 className="text-lg font-bold text-slate-900">Facturación</h3>
          <p className="mt-2">La jornada todavía no está activa.</p>
          <p className="mt-1">Iniciá el turno para habilitar facturación y cobranzas.</p>
        </div>
      </div>
    );
  }

  const fetchBillingDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (invoiceSourceFilter) params.set('sourceType', invoiceSourceFilter);
      const res = await fetch(`/api/v2/billing/documents${params.toString() ? `?${params.toString()}` : ''}`);
      const data = await res.json();
      setBillingDocuments(Array.isArray(data) ? (data as BillingDocument[]) : []);
    } catch {
      setError('No se pudo cargar la facturación.');
    } finally {
      setLoading(false);
    }
  };

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

  const fetchClosures = async () => {
    try {
      setLoadingClosures(true);
      const params = new URLSearchParams();
      params.set('type', 'zeta');
      if (parkinglotId) params.set('parkinglotId', parkinglotId);
      if (cajaNumero) params.set('cajaNumero', cajaNumero);
      const res = await fetch(`/api/v2/billing/closures?${params.toString()}`);
      const data = await res.json();
      setClosures(Array.isArray(data) ? data : []);
    } catch {
      setClosures([]);
    } finally {
      setLoadingClosures(false);
    }
  };

  const fetchCajasDisponibles = async (nextParkinglotId?: string) => {
    try {
      const arr = await sharedFetchCajasDisponibles(nextParkinglotId);
      setCajasDisponibles(Array.isArray(arr) ? arr : []);
      // Auto-select first caja if none selected
      if (Array.isArray(arr) && arr.length > 0 && !cajaNumero) {
        setCajaNumero(String(arr[0].numero));
      }
    } catch (e) {
      ( (sharedLogger && typeof sharedLogger.debug === 'function') ? sharedLogger.debug : console.debug)('fetchCajasDisponibles:error', e);
      setCajasDisponibles([]);
    }
  };

  const fetchSelectedParkingBillingProfile = async (nextParkinglotId?: string) => {
    if (!nextParkinglotId) {
      setSelectedParkingBillingProfile(null);
      return;
    }

    try {
      setLoadingParkingBillingProfile(true);
      const res = await fetch(`/api/v2/billing/parkings/${nextParkinglotId}/profile`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo cargar el perfil fiscal de la playa');
      setSelectedParkingBillingProfile(data.billingProfile ?? null);
    } catch {
      setSelectedParkingBillingProfile(null);
    } finally {
      setLoadingParkingBillingProfile(false);
    }
  };

  useEffect(() => {
    void fetchBillingDocuments();
    void fetchClosures();
    void fetchCajasDisponibles();
    void fetchBillingParkings();
  }, [invoiceSourceFilter]);

  useEffect(() => {
    if (ownerOperations?.selectedParkingId && ownerOperations.selectedParkingId !== parkinglotId) {
      setParkinglotId(ownerOperations.selectedParkingId);
      return;
    }
    void fetchCajasDisponibles(parkinglotId || undefined);
    void fetchSelectedParkingBillingProfile(parkinglotId || undefined);
    setCajaNumero('');
  }, [parkinglotId, ownerOperations?.selectedParkingId]);

  const filteredBillingDocuments = useMemo(() => {
    return billingDocuments.filter((f) => {
      const text = `${f.abonadoNombre || ''} ${f.abonadoEmail || ''} ${f.ticketNumber || ''} ${f.ticketPatente || ''} ${f.invoiceCode || ''} ${f.paymentReference || ''} ${f.periodoLabel || ''}`.toLowerCase();
      const matchesSearch = !invoiceSearch || text.includes(invoiceSearch.toLowerCase());
      const matchesEstado = !invoiceStatusFilter || f.estado === invoiceStatusFilter;
      const matchesTipo = !invoiceTypeFilter || f.tipoFacturacion === invoiceTypeFilter;
      const matchesSource = !invoiceSourceFilter || (f.sourceType || 'abonado') === invoiceSourceFilter;
      const matchesFiscalSource = !fiscalSourceFilter || (f.fiscalSource || 'fallback') === fiscalSourceFilter;
      const matchesFiscalStatus = !fiscalStatusFilter || (f.fiscalStatus || 'invalid') === fiscalStatusFilter;
      return matchesSearch && matchesEstado && matchesTipo && matchesSource && matchesFiscalSource && matchesFiscalStatus;
    });
  }, [billingDocuments, invoiceSearch, invoiceStatusFilter, invoiceTypeFilter, invoiceSourceFilter, fiscalSourceFilter, fiscalStatusFilter]);

  const billingDocumentsByPeriod = useMemo(() => {
    return filteredBillingDocuments.reduce((acc, billingDocument) => {
      const periodo = billingDocument.periodoLabel || 'Sin período';
      if (!acc[periodo]) acc[periodo] = [];
      acc[periodo].push(billingDocument);
      return acc;
    }, {} as Record<string, BillingDocument[]>);
  }, [filteredBillingDocuments]);

  const parkingsFacturacion = useMemo(() => parkings, [parkings]);

  const executiveSummary = useMemo(() => {
    return filteredBillingDocuments.reduce((acc, billingDocument) => {
      const monto = Number(billingDocument.monto || 0);
      acc.totalFacturado += monto;
      if (billingDocument.estado === 'pagada') acc.totalPagado += monto;
      if (billingDocument.estado === 'vencida') acc.totalVencido += monto;
      if (billingDocument.estado === 'emitida' || billingDocument.estado === 'pendiente' || billingDocument.estado === 'vencida') acc.totalDeuda += monto;
      return acc;
    }, { totalFacturado: 0, totalPagado: 0, totalVencido: 0, totalDeuda: 0 });
  }, [filteredBillingDocuments]);

  const hasValidSelectedParkingBillingProfile = useMemo(() => {
    if (!parkinglotId) return true;
    return Boolean(
      selectedParkingBillingProfile?.enabled &&
      String(selectedParkingBillingProfile?.businessName ?? '').trim() &&
      String(selectedParkingBillingProfile?.documentNumber ?? '').trim() &&
      String(selectedParkingBillingProfile?.pointOfSale ?? '').trim(),
    );
  }, [parkinglotId, selectedParkingBillingProfile]);

  const runFinancialControl = async () => {
    try {
      setError(null);
      publishStatus('info', null);
      const res = await fetch('/api/v2/abonados/financial/run', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo ejecutar el control financiero');
      setFinancialRunSummary(data);
      publishStatus('success', 'Control financiero ejecutado correctamente.');
      await fetchBillingDocuments();
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    }
  };

  const reconcilePaymentReference = async () => {
    try {
      setError(null);
      publishStatus('info', null);
      setReconcileSummary(null);
      if (!paymentReference.trim()) {
        setError('Debes ingresar una referencia de pago.');
        return;
      }
      const res = await fetch('/api/v2/abonados/payments/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentReference: paymentReference.trim(), paymentProvider: 'electronic', paymentMethod: 'electronic' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo conciliar el pago');
      setReconcileSummary(data);
      publishStatus('success', 'Conciliación de pago ejecutada correctamente.');
      await fetchBillingDocuments();
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    }
  };

  const marcarDocumento = async (documentId: string, estado: 'pagada' | 'vencida' | 'cancelada') => {
    try {
      setError(null);
      publishStatus('info', null);
      const res = await fetch(`/api/v2/billing/documents/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar la factura');
      publishStatus('success', `Factura actualizada a ${estado}.`);
      await fetchBillingDocuments();
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    }
  };

  const acreditarDocumento = async (documentId: string) => {
    try {
      setError(null);
      publishStatus('info', null);
      const res = await fetch(`/api/v2/billing/documents/${documentId}/acreditar`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentProvider: 'electronic', paymentMethod: 'electronic', adminCashTurnoId: adminCashTurno._id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo acreditar el pago');
      publishStatus('success', 'Pago acreditado automáticamente.');
      await fetchBillingDocuments();
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    }
  };

  const ejecutarCierreZ = async () => {
    try {
      setClosureMessage(null);
      setError(null);
      const res = await fetch('/api/v2/billing/closures/zeta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parkinglotId: parkinglotId || null,
          cajaNumero: cajaNumero ? Number(cajaNumero) : null,
          from: closureFrom ? new Date(closureFrom).toISOString() : null,
          to: closureTo ? new Date(closureTo).toISOString() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo ejecutar el cierre Z');
      setClosureMessage('Cierre Z ejecutado correctamente.');
      setSelectedClosure(data);
      await fetchClosures();
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    }
  };

  const verDetalleCierre = async (closureId: string) => {
    try {
      setError(null);
      const res = await fetch(`/api/v2/billing/closures/${closureId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo cargar el detalle del cierre');
      setSelectedClosure(data);
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    }
  };

  useEffect(() => {
    publishStatus('info', null);
    setError(null);
    setClosureMessage(null);
    setReconcileSummary(null);
    setFinancialRunSummary(null);
    setSelectedClosure(null);
  }, [selectedTabIndex]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total facturado</p><p className="mt-2 text-2xl font-bold text-gray-900">${executiveSummary.totalFacturado.toFixed(2)}</p></div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Total pagado</p><p className="mt-2 text-2xl font-bold">${executiveSummary.totalPagado.toFixed(2)}</p></div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Total deuda</p><p className="mt-2 text-2xl font-bold">${executiveSummary.totalDeuda.toFixed(2)}</p></div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><p className="text-xs font-semibold uppercase tracking-wide text-red-600">Total vencido</p><p className="mt-2 text-2xl font-bold">${executiveSummary.totalVencido.toFixed(2)}</p></div>
      </div>

      <div className="dashboard-section p-5 md:p-6 space-y-4">
        <Tab.Group selectedIndex={selectedTabIndex} onChange={(i)=>{
            const cajaIndex = 4; // Documentos=0, Fiscal=1, Cierres=2, Control=3, Caja admin=4
            if (i !== cajaIndex) {
              // require parking selected and that turno corresponds to selected parking
            }
            setSelectedTabIndex(i);
          }}>
          <Tab.List className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
            {['Facturas', 'Fiscal', 'Cierres', 'Conciliación', 'Caja activa'].map((tab) => (
              <Tab
                key={tab}
                className={({ selected }) =>
                  classNames(
                    'inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition',
                    selected
                      ? 'border-gray-300 bg-gray-200 text-gray-800'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
                  )
                }
              >
                {tab}
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels className="mt-6 space-y-6">
            <Tab.Panel className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
                <input value={invoiceSearch} onChange={(e) => setInvoiceSearch(e.target.value)} placeholder="Buscar por abonado, ticket, patente, código, referencia o período" className="rounded-xl border border-gray-300 px-4 py-3" />
                <select value={invoiceStatusFilter} onChange={(e) => setInvoiceStatusFilter(e.target.value)} className="rounded-xl border border-gray-300 bg-white px-4 py-3"><option value="">Todos los estados</option><option value="emitida">Emitida</option><option value="pendiente">Pendiente</option><option value="pagada">Pagada</option><option value="vencida">Vencida</option><option value="cancelada">Cancelada</option></select>
                <select value={invoiceTypeFilter} onChange={(e) => setInvoiceTypeFilter(e.target.value)} className="rounded-xl border border-gray-300 bg-white px-4 py-3"><option value="">Todos los tipos</option><option value="mensual">Mensual</option><option value="diaria">Diaria</option><option value="hora">Por hora</option></select>
                <select value={invoiceSourceFilter} onChange={(e) => setInvoiceSourceFilter(e.target.value)} className="rounded-xl border border-gray-300 bg-white px-4 py-3"><option value="">Todos los orígenes</option><option value="abonado">Abonados</option><option value="ticket">Tickets</option></select>
                <select value={fiscalSourceFilter} onChange={(e) => setFiscalSourceFilter(e.target.value)} className="rounded-xl border border-gray-300 bg-white px-4 py-3"><option value="">Todo origen fiscal</option><option value="parking">Fiscal playa</option><option value="user">Fallback user</option><option value="fallback">Sin perfil</option></select>
                <select value={fiscalStatusFilter} onChange={(e) => setFiscalStatusFilter(e.target.value)} className="rounded-xl border border-gray-300 bg-white px-4 py-3"><option value="">Todo estado fiscal</option><option value="valid">Válido</option><option value="fallback">Fallback</option><option value="invalid">Inválido</option></select>
              </div>

              {loading ? <p className="text-sm text-gray-500">Cargando documentos...</p> : null}
              {!filteredBillingDocuments.length ? (
                <p className="text-sm text-gray-500">No hay documentos para los filtros actuales.</p>
              ) : (
                <BillingControls>
                  <BillingDocumentsList
                    billingDocumentsByPeriod={billingDocumentsByPeriod}
                    acreditarDocumento={acreditarDocumento}
                    marcarDocumento={marcarDocumento}
                  />
                </BillingControls>
              )}
            </Tab.Panel>

            <Tab.Panel className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <select value={parkinglotId} onChange={(e) => setParkinglotId(e.target.value)} className="rounded-xl border border-gray-300 bg-white px-4 py-3" disabled={loadingParkings}>
                  <option value="">Seleccionar playa para perfil fiscal</option>
                  {parkingsFacturacion.map((parking) => (
                    <option key={parking._id} value={parking._id}>{parking.name}</option>
                  ))}
                </select>
                {parkinglotId ? (
                  <button onClick={() => setIsQuickFiscalEditorOpen(true)} className="rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50">
                    Editar perfil fiscal
                  </button>
                ) : null}
              </div>

              {loadingParkingBillingProfile ? (
                <p className="text-xs text-gray-500">Cargando perfil fiscal de la playa...</p>
              ) : selectedParkingBillingProfile ? (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 space-y-3">
                  <p className="font-semibold">Perfil fiscal activo de la playa seleccionada</p>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    <p><strong>Habilitado:</strong> {selectedParkingBillingProfile.enabled ? 'Sí' : 'No'}</p>
                    <p><strong>Razón social:</strong> {selectedParkingBillingProfile.businessName || '-'}</p>
                    <p><strong>Condición fiscal:</strong> {selectedParkingBillingProfile.taxCondition || '-'}</p>
                    <p><strong>Documento:</strong> {selectedParkingBillingProfile.documentType || '-'} {selectedParkingBillingProfile.documentNumber || ''}</p>
                    <p><strong>Punto de venta:</strong> {selectedParkingBillingProfile.pointOfSale || '-'}</p>
                    <p><strong>Comprobante default:</strong> {selectedParkingBillingProfile.voucherTypeDefault || '-'}</p>
                  </div>
                </div>
              ) : parkinglotId ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 space-y-3">
                  <p>La playa seleccionada no tiene perfil fiscal configurado.</p>
                  <button onClick={() => setIsQuickFiscalEditorOpen(true)} className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100">
                    Configurar perfil fiscal
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Selecciona una playa para consultar o editar su perfil fiscal de facturación.</p>
              )}
            </Tab.Panel>

            <Tab.Panel className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <select value={parkinglotId} onChange={(e) => setParkinglotId(e.target.value)} className="rounded-xl border border-gray-300 bg-white px-4 py-3" disabled={loadingParkings}>
                  <option value="">Todas las playas permitidas</option>
                  {parkingsFacturacion.map((parking) => (
                    <option key={parking._id} value={parking._id}>{parking.name}</option>
                  ))}
                </select>
                <select value={cajaNumero} onChange={(e) => setCajaNumero(e.target.value)} className="rounded-xl border border-gray-300 bg-white px-4 py-3">
                  <option value="">Todas las cajas</option>
                  {cajasDisponibles.map((caja) => (
                    <option key={caja.numero} value={String(caja.numero)}>Caja {caja.numero}</option>
                  ))}
                </select>
                <input type="date" value={closureFrom} onChange={(e) => setClosureFrom(e.target.value)} className="rounded-xl border border-gray-300 px-4 py-3" />
                <input type="date" value={closureTo} onChange={(e) => setClosureTo(e.target.value)} className="rounded-xl border border-gray-300 px-4 py-3" />
              </div>
              <p className="text-xs text-gray-500">Owner solo puede ejecutar cierres sobre playas propias. Operator queda atado a su playa asignada y no está habilitado para cierre Z.</p>

              {!hasValidSelectedParkingBillingProfile && parkinglotId ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 space-y-3">
                  <p>No se puede ejecutar cierre Z hasta que la playa seleccionada tenga un perfil fiscal válido y habilitado.</p>
                  <button onClick={() => setIsQuickFiscalEditorOpen(true)} className="rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-800 hover:bg-red-100">
                    Editar perfil fiscal
                  </button>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button onClick={() => void ejecutarCierreZ()} disabled={!hasValidSelectedParkingBillingProfile} className="rounded-xl border border-gray-300 bg-gray-200 px-5 py-3 font-semibold text-gray-800 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">Ejecutar cierre Z</button>
                <button onClick={() => void fetchClosures()} className="rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50">Refrescar cierres</button>
              </div>

              {closureMessage ? <p className="text-sm text-green-700">{closureMessage}</p> : null}
              {loadingClosures ? <p className="text-sm text-gray-500">Cargando cierres fiscales...</p> : null}
              {!closures.length ? <p className="text-sm text-gray-500">No hay cierres fiscales registrados para los filtros seleccionados.</p> : (
                <div className="space-y-3">
                  {closures.map((cierre) => (
                    <div key={cierre._id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                          <p><strong>Tipo:</strong> {cierre.type}</p>
                          <p><strong>Estado:</strong> {cierre.status}</p>
                          <p><strong>Caja:</strong> {cierre.cajaNumero ?? '-'}</p>
                          <p><strong>Desde:</strong> {cierre.from ? new Date(cierre.from).toLocaleString() : '-'}</p>
                          <p><strong>Hasta:</strong> {cierre.to ? new Date(cierre.to).toLocaleString() : '-'}</p>
                          <p><strong>Total:</strong> ${Number(cierre?.totals?.total ?? 0).toFixed(2)}</p>
                          <p><strong>Docs:</strong> {cierre?.totals?.documentsCount ?? 0}</p>
                          <p><strong>Por tipo:</strong> {JSON.stringify(cierre?.totals?.documentsByType ?? {})}</p>
                        </div>
                        <div>
                          <button onClick={() => void verDetalleCierre(cierre._id)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Ver detalle</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedClosure ? (
                <div className="rounded-2xl border border-gray-300 bg-white p-4 text-sm text-gray-700 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-base font-bold text-gray-900">Detalle de cierre</h4>
                    <button onClick={() => setSelectedClosure(null)} className="rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200">Cerrar detalle</button>
                  </div>
                  <p><strong>ID:</strong> {selectedClosure._id}</p>
                  <p><strong>Tipo:</strong> {selectedClosure.type}</p>
                  <p><strong>Estado:</strong> {selectedClosure.status}</p>
                  <p><strong>Actor:</strong> {selectedClosure.actorRole || '-'}</p>
                  <p><strong>Caja:</strong> {selectedClosure.cajaNumero ?? '-'}</p>
                  <p><strong>Owner:</strong> {selectedClosure.ownerId || '-'}</p>
                  <p><strong>Parking:</strong> {selectedClosure.assignedParking || '-'}</p>
                  <p><strong>Desde:</strong> {selectedClosure.from ? new Date(selectedClosure.from).toLocaleString() : '-'}</p>
                  <p><strong>Hasta:</strong> {selectedClosure.to ? new Date(selectedClosure.to).toLocaleString() : '-'}</p>
                  <p><strong>Total:</strong> ${Number(selectedClosure?.totals?.total ?? 0).toFixed(2)}</p>
                  <p><strong>Efectivo:</strong> ${Number(selectedClosure?.totals?.efectivo ?? 0).toFixed(2)}</p>
                  <p><strong>Tarjeta:</strong> ${Number(selectedClosure?.totals?.tarjeta ?? 0).toFixed(2)}</p>
                  <p><strong>QR:</strong> ${Number(selectedClosure?.totals?.qr ?? 0).toFixed(2)}</p>
                  <p><strong>Otros:</strong> ${Number(selectedClosure?.totals?.otros ?? 0).toFixed(2)}</p>
                  <p><strong>Documentos:</strong> {selectedClosure?.totals?.documentsCount ?? 0}</p>
                  <p><strong>Por tipo:</strong> {JSON.stringify(selectedClosure?.totals?.documentsByType ?? {})}</p>
                  <p><strong>Documentos vinculados:</strong> {Array.isArray(selectedClosure?.linkedDocumentIds) ? selectedClosure.linkedDocumentIds.length : 0}</p>

                  {Array.isArray(selectedClosure?.documents) && selectedClosure.documents.length > 0 ? (
                    <div className="mt-4 space-y-3">
                      <h5 className="text-sm font-bold text-gray-900">Documentos incluidos</h5>
                      {selectedClosure.documents.map((doc: any) => (
                        <div key={doc._id} className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                            <p><strong>ID:</strong> {doc._id}</p>
                            <p><strong>Código:</strong> {doc.invoiceCode || '-'}</p>
                            <p><strong>Comprobante:</strong> {doc.voucherType || '-'}</p>
                            <p><strong>Tipo:</strong> {doc.tipoFacturacion || '-'}</p>
                            <p><strong>Estado:</strong> {doc.estado || '-'}</p>
                            <p><strong>Monto:</strong> ${Number(doc.monto || 0).toFixed(2)}</p>
                            <p><strong>Origen fiscal:</strong> {doc?.snapshot?.fiscal?.source === 'parking' ? 'Fiscal playa' : doc?.snapshot?.fiscal?.source === 'user' ? 'Fallback user' : 'Sin perfil'}</p>
                            <p><strong>Estado fiscal:</strong> {doc?.snapshot?.fiscal?.status === 'valid' ? 'Válido' : doc?.snapshot?.fiscal?.status === 'fallback' ? 'Fallback' : 'Inválido'}</p>
                            <p><strong>Playa emisora:</strong> {doc?.snapshot?.parking?.name || '-'}</p>
                            <p><strong>Punto de venta:</strong> {doc?.snapshot?.parking?.billingProfile?.pointOfSale || doc?.pointOfSale || '-'}</p>
                            <p><strong>Empresa emisora:</strong> {doc?.snapshot?.parking?.billingProfile?.businessName || '-'}</p>
                            <p><strong>Referencia:</strong> {doc.paymentReference || '-'}</p>
                            <p><strong>Método:</strong> {doc.paymentMethod || '-'}</p>
                            <p><strong>Abonado:</strong> {`${doc?.snapshot?.abonado?.nombre ?? ''} ${doc?.snapshot?.abonado?.apellido ?? ''}`.trim() || '-'}</p>
                            <p><strong>Tarifa:</strong> {doc?.snapshot?.tarifaNombre || '-'}</p>
                            <p><strong>Emitida:</strong> {doc.fechaEmision ? new Date(doc.fechaEmision).toLocaleString() : '-'}</p>
                            <p><strong>Vence:</strong> {doc.fechaVencimiento ? new Date(doc.fechaVencimiento).toLocaleDateString() : '-'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p><strong>Detalle documentos:</strong> no disponible.</p>
                  )}
                </div>
              ) : null}
            </Tab.Panel>

            <Tab.Panel className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Control y conciliación</h2>
                  <p className="mt-1 text-sm text-gray-500">Conciliación de pagos y control financiero dentro del contexto operativo activo.</p>
                </div>
                <button onClick={() => void runFinancialControl()} className="rounded-xl border border-gray-300 bg-gray-200 px-5 py-3 font-semibold text-gray-800 hover:bg-gray-300">Ejecutar control financiero</button>
              </div>

              <BillingControls>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
                  <input value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder="Referencia de pago electrónico" className="rounded-xl border border-gray-300 px-4 py-3" />
                  <button onClick={() => void reconcilePaymentReference()} className="rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50">Conciliar pago</button>
                </div>

                {(!ownerOperations?.setStatusMessage && message) ? <p className="text-sm text-green-700">{message}</p> : null}
                {error ? <p className="text-sm text-red-600">{error}</p> : null}
                {reconcileSummary ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><p><strong>Referencia conciliada:</strong> {reconcileSummary.paymentReference || '-'}</p><p><strong>Facturas actualizadas:</strong> {reconcileSummary.invoicesUpdated ?? 0}</p><p><strong>Abonados reactivados:</strong> {reconcileSummary.abonadosReactivated ?? 0}</p></div> : null}
                {financialRunSummary ? <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700"><p><strong>Última ejecución:</strong> {financialRunSummary.timestamp ? new Date(financialRunSummary.timestamp).toLocaleString() : '-'}</p><p><strong>Facturas revisadas:</strong> {financialRunSummary.invoicesChecked ?? 0}</p><p><strong>Facturas marcadas vencidas:</strong> {financialRunSummary.invoicesMarkedOverdue ?? 0}</p><p><strong>Abonados suspendidos:</strong> {financialRunSummary.abonadosSuspended ?? 0}</p></div> : null}
              </BillingControls>
            </Tab.Panel>

            <Tab.Panel className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Caja activa</h2>
                <p className="mt-1 text-sm text-gray-500">Referencia del contexto operativo actual para la playa seleccionada.</p>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <label htmlFor="admin-parking-select" className="sr-only">Playa</label>
                  <select id="admin-parking-select" value={parkinglotId} onChange={(e) => setParkinglotId(e.target.value)} className="rounded-xl border border-gray-300 bg-white px-4 py-3" disabled={loadingParkings}>
                    <option value="">Seleccionar playa activa</option>
                    {parkingsFacturacion.map((parking) => (
                      <option key={parking._id} value={parking._id}>{parking.name}</option>
                    ))}
                  </select>

                  <label htmlFor="admin-caja-select" className="sr-only">Caja</label>
                  {cajasDisponibles.length > 0 ? (
                    <select id="admin-caja-select" value={cajaNumero} onChange={(e) => setCajaNumero(e.target.value)} className="rounded-xl border border-gray-300 bg-white px-4 py-3">
                      <option value="">Seleccionar caja</option>
                      {cajasDisponibles.map((caja) => (
                        <option key={caja.numero} value={String(caja.numero)}>Caja {caja.numero}</option>
                      ))}
                    </select>
                  ) : (
                    <input id="admin-caja-select" type="number" min="1" placeholder="Ingresar núm. de caja" value={cajaNumero} onChange={(e) => setCajaNumero(e.target.value)} className="rounded-xl border border-gray-300 px-4 py-3" />
                  )}
                  <div />
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 space-y-2">
                <p>El contexto operativo activo se gestiona desde el shell principal.</p>
                <p><strong>Playa seleccionada:</strong> {parkinglotId || '-'}</p>
                <p><strong>Caja seleccionada:</strong> {cajaNumero || '-'}</p>
                <p className="text-xs text-gray-500">Las acciones de apertura y cierre se resuelven fuera de este módulo.</p>
              </div>
            </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>

      {parkinglotId ? (
        <ParkingBillingProfileQuickEditor
          parkinglotId={parkinglotId}
          parkingName={parkingsFacturacion.find((parking) => String(parking._id) === String(parkinglotId))?.name}
          open={isQuickFiscalEditorOpen}
          onClose={() => setIsQuickFiscalEditorOpen(false)}
          onSaved={(billingProfile) => {
            setSelectedParkingBillingProfile(billingProfile);
            setIsQuickFiscalEditorOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}
