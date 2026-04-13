'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTurnoAdmin } from '@/modules/admin-caja/hooks/useTurnoAdmin';
import BillingDocumentsList from '@/modules/billing/components/BillingDocumentsList';

interface AdminTurnoPanelProps {
  parkinglotId: string;
  onTurnoChange?: (turno: any | null) => void;
  externalTurno?: any | null; // optional: allow parent to own turno state
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

const AdminTurnoPanel: React.FC<AdminTurnoPanelProps> = ({ parkinglotId, onTurnoChange, externalTurno }) => {
  const { data: session } = useSession();
  const { turno: turnoHook, abrir, loading, error, cerrar, liquidar, registrarCobro } = useTurnoAdmin(parkinglotId);

  // prefer externalTurno (passed from parent) when present; otherwise use hook turno
  const turno = externalTurno ?? turnoHook;

  // useEffect to propagate changes from hook to parent
  useEffect(() => {
    if (typeof onTurnoChange === 'function') onTurnoChange(turnoHook ?? null);
  }, [turnoHook, onTurnoChange]);

  const abrirTurno = async () => {
    try {
      await abrir({ operatorName: session?.user?.name ?? '' });
    } catch (err) {
      console.error(err);
    }
  };

  const mostrarNumeroTurno = Boolean(turno?.numeroTurno && turno.numeroTurno > 0);
  const totalTickets = turno?.tickets?.length ?? 0;
  const cajaNumber = Number(turno?.cajaNumero ?? turno?.numeroCaja ?? 0) || 1;

  const [billingDocuments, setBillingDocuments] = useState<any[]>([]);
  const [loadingBillingDocs, setLoadingBillingDocs] = useState(false);

  const fetchBillingDocs = async () => {
    if (!parkinglotId) return setBillingDocuments([]);
    setLoadingBillingDocs(true);
    try {
      const params = new URLSearchParams();
      params.set('parkinglotId', parkinglotId);
      const res = await fetch(`/api/v2/billing/documents?${params.toString()}`, { credentials: 'include' });
      const data = await res.json();
      setBillingDocuments(Array.isArray(data) ? data : []);
    } catch (e) {
      setBillingDocuments([]);
    } finally {
      setLoadingBillingDocs(false);
    }
  };

  useEffect(() => {
    void fetchBillingDocs();
  }, [parkinglotId, turno?._id]);

  const billingDocumentsByPeriod = useMemo(() => {
    return (billingDocuments || []).reduce((acc: Record<string, any[]>, billingDocument: any) => {
      const periodo = billingDocument.periodoLabel || 'Sin período';
      if (!acc[periodo]) acc[periodo] = [];
      acc[periodo].push(billingDocument);
      return acc;
    }, {} as Record<string, any[]>);
  }, [billingDocuments]);

  const acreditarDocumento = async (documentId: string) => {
    if (!turno?._id) return alert('Abrí un turno administrativo antes.');
    try {
      const res = await fetch(`/api/v2/billing/documents/${documentId}/acreditar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentProvider: 'electronic', paymentMethod: 'electronic', adminCashTurnoId: turno._id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudo acreditar');
      await fetchBillingDocs();
      alert('Pago acreditado.');
    } catch (e: any) {
      alert(e?.message || 'Error');
    }
  };

  const marcarDocumento = async (documentId: string, estado: 'pagada' | 'vencida' | 'cancelada') => {
    try {
      const res = await fetch(`/api/v2/billing/documents/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudo actualizar');
      await fetchBillingDocs();
      alert('Documento actualizado.');
    } catch (e: any) {
      alert(e?.message || 'Error');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {loading ? (
        <div className="dashboard-section p-6 text-center text-gray-500 font-medium">Cargando turno...</div>
      ) : turno ? (
        <div className="space-y-6">
          <div className="dashboard-section p-5 md:p-6">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Turno administrativo actual</h3>
                <p className="mt-1 text-sm text-gray-500">Ficha operativa del turno administrativo en curso.</p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
                <span className={`h-2.5 w-2.5 rounded-full ${turno.estado === 'abierto' ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                {turno.estado}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-x-10 md:grid-cols-2 xl:grid-cols-3">
              {mostrarNumeroTurno ? <Row label="Turno" value={turno.numeroTurno} /> : null}
              <Row label="Caja" value={String(cajaNumber).padStart(3, '0')} />
              <Row label="Apertura" value={formatDate(turno.fechaApertura)} />
              <Row label="Tickets" value={totalTickets} />
              <Row label="Total cobrado" value={formatMoney(turno.totalTurno)} />
              {turno.fechaCierre ? <Row label="Cierre" value={formatDate(turno.fechaCierre)} /> : null}
            </div>

            <div className="mt-4 flex gap-3">
              {turno.estado === 'abierto' ? (
                <>
                  <button onClick={async () => {
                    
                    try {
                      const ok = await cerrar();
                      if (!ok) {
                        // fallback: try direct fetch to ensure server receives the request
                        if (!turno?._id) return alert('No hay turno disponible para cerrar.');
                        const res = await fetch('/api/v2/billing/admin-cash', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify({ turnoId: turno._id, action: 'close' }),
                        });
                        const data = await res.json().catch(() => ({}));
                        if (!res.ok) throw new Error(data?.error || data?.message || 'Error al cerrar turno');
                        alert('Turno cerrado (fallback).');
                        return;
                      }
                      alert('Turno cerrado.');
                    } catch (e: any) {
                      console.error('[ADMIN-TURNOPANEL] cerrar failed', e);
                      alert(e?.message || 'Error al cerrar turno');
                    }
                  }} className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">Cerrar turno administrativo</button>

                  <button onClick={async () => {
                    
                    try {
                      const result = await liquidar();
                      if (!result) {
                        if (!turno?._id) return alert('No hay turno disponible para liquidar.');
                        const res = await fetch('/api/v2/billing/admin-cash', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify({ turnoId: turno._id, liquidar: true }),
                        });
                        const data = await res.json().catch(() => ({}));
                        if (!res.ok) throw new Error(data?.error || data?.message || 'Error al liquidar turno');
                        alert('Turno liquidado (fallback).');
                        return;
                      }
                      alert('Turno liquidado.');
                    } catch (e: any) {
                      console.error('[ADMIN-TURNOPANEL] liquidar failed', e);
                      alert(e?.message || 'Error al liquidar turno');
                    }
                  }} className="rounded-xl border border-green-300 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">Liquidar turno</button>

                  <button onClick={async () => {
                    
                    const monto = Number(prompt('Monto cobrado (ej: 100)') || 0);
                    if (monto <= 0) return;
                    try {
                      const r = await registrarCobro({ monto, paymentMethod: 'efectivo' });
                      if (!r) throw new Error('No se pudo registrar el cobro');
                      alert('Cobro registrado.');
                    } catch (e: any) {
                      console.error('[ADMIN-TURNOPANEL] registrarCobro failed', e);
                      // fallback to direct POST
                      if (!turno?._id) return alert('No hay turno disponible');
                      try {
                        const res = await fetch('/api/v2/billing/admin-cash/transaction', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify({ turnoId: turno._id, monto, paymentMethod: 'efectivo' }),
                        });
                        const data = await res.json().catch(() => ({}));
                        if (!res.ok) throw new Error(data?.error || data?.message || 'Error al registrar cobro');
                        alert('Cobro registrado (fallback).');
                        // refresh billing docs and turno
                        await fetchBillingDocs();
                      } catch (e2: any) {
                        console.error('[ADMIN-TURNOPANEL] fallback registrarCobro failed', e2);
                        alert(e2?.message || 'Error al registrar cobro');
                      }
                    }
                  }} className="rounded-xl border border-gray-300 bg-gray-200 px-4 py-2 text-sm font-semibold">Registrar cobro admin</button>
                </>
              ) : null}

              {turno.liquidacion?.reportUrl ? (
                <a href={turno.liquidacion.reportUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold">Descargar reporte</a>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            <h4 className="text-base font-bold text-gray-900">Facturas y acreditaciones (acción bajo turno)</h4>
            {loadingBillingDocs ? <p className="text-sm text-gray-500">Cargando facturas...</p> : (
              <BillingDocumentsList billingDocumentsByPeriod={billingDocumentsByPeriod} acreditarDocumento={acreditarDocumento} marcarDocumento={marcarDocumento} canAcreditarManual={Boolean(turno?._id)} />
            )}
          </div>

        </div>
      ) : (
        <div className="dashboard-section p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900">Sin turno administrativo abierto</h3>
          <p className="mt-2 text-sm text-gray-500">Abrí un turno administrativo para comenzar a registrar cobros.</p>
          <button onClick={abrirTurno} className="mt-5 rounded-xl border border-gray-300 bg-gray-200 px-5 py-3 font-semibold text-gray-800 hover:bg-gray-300">Abrir Turno administrativo</button>
          {error ? <p className="mt-3 text-red-600">{error}</p> : null}
        </div>
      )}
    </div>
  );
};

export default AdminTurnoPanel;
