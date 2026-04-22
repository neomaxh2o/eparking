'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTurnoAdmin } from '@/modules/admin-caja/hooks/useTurnoAdmin';
import BillingDocumentsList from '@/modules/billing/components/BillingDocumentsList';

interface AdminTurnoPanelProps {
  parkinglotId: string;
  onTurnoChange?: (turno: any | null) => void;
  externalTurno?: any | null;
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
  const { turno: turnoHook, liquidacion, loadingFetch, loadingOpen, loadingClose, loadingLiquidar, loadingCobro, error, abrir, cerrar, liquidar, registrarCobro } = useTurnoAdmin(parkinglotId);

  const turno = externalTurno ?? turnoHook;
  const turnoEstadoRaw = String(turno?.estado ?? '').trim();
  const turnoEstadoNormalizado = turnoEstadoRaw.toLowerCase();
  const turnoAbierto = turnoEstadoNormalizado === 'abierto' || turnoEstadoNormalizado === 'en_curso';
  const turnoLiquidado = turnoEstadoNormalizado === 'liquidado';
  const turnoEstadoLabel = turnoEstadoNormalizado ? turnoEstadoNormalizado.toUpperCase().replace(/_/g, ' ') : turnoEstadoRaw;

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
  const totalTickets = liquidacion?.cantidadTickets ?? turno?.tickets?.length ?? 0;
  const cajaNumber = Number(turno?.cajaNumero ?? turno?.numeroCaja ?? liquidacion?.cajaNumero ?? 0) || 1;

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
    } catch {
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
    if (!turno?._id || !turnoAbierto) return alert('Abrí un turno administrativo antes.');
    try {
      const res = await fetch(`/api/v2/billing/documents/${documentId}/acreditar`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
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
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado, ...(estado === 'pagada' ? { adminCashTurnoId: turno?._id ?? null } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudo actualizar');
      await fetchBillingDocs();
      alert('Documento actualizado.');
    } catch (e: any) {
      alert(e?.message || 'Error');
    }
  };

  const resumenConfirmacion = useMemo(() => {
    if (!turno?._id) return null;
    return {
      tickets: liquidacion?.cantidadTickets ?? turno?.tickets?.length ?? 0,
      operaciones: liquidacion?.cantidadOperaciones ?? (turno?.tickets?.length ?? 0),
      efectivo: liquidacion?.totalEfectivo ?? 0,
      transferencia: liquidacion?.totalTransferencia ?? 0,
      tarjeta: liquidacion?.totalTarjeta ?? 0,
      otros: liquidacion?.totalOtros ?? 0,
      ingresos: liquidacion?.totalIngresos ?? turno?.totalTurno ?? 0,
      saldo: liquidacion?.saldoTeorico ?? turno?.totalTurno ?? 0,
    };
  }, [liquidacion, turno]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {loadingFetch ? (
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
                <span className={`h-2.5 w-2.5 rounded-full ${turnoAbierto ? 'bg-emerald-500' : turnoLiquidado ? 'bg-blue-500' : 'bg-amber-500'}`}></span>
                {turnoEstadoLabel || turno.estado}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-x-10 md:grid-cols-2 xl:grid-cols-3">
              {mostrarNumeroTurno ? <Row label="Turno" value={turno.numeroTurno} /> : null}
              <Row label="Caja" value={String(cajaNumber).padStart(3, '0')} />
              <Row label="Apertura" value={formatDate(turno.fechaApertura)} />
              <Row label="Tickets" value={totalTickets} />
              <Row label="Total cobrado" value={formatMoney(liquidacion?.saldoTeorico ?? turno.totalTurno)} />
              {turno.fechaCierre ? <Row label="Cierre" value={formatDate(turno.fechaCierre)} /> : null}
            </div>

            {resumenConfirmacion ? (
              <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                <p className="font-semibold text-gray-900">Resumen previo de liquidación</p>
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div><strong>Tickets:</strong> {resumenConfirmacion.tickets}</div>
                  <div><strong>Operaciones:</strong> {resumenConfirmacion.operaciones}</div>
                  <div><strong>Saldo teórico:</strong> {formatMoney(resumenConfirmacion.saldo)}</div>
                  <div><strong>Efectivo:</strong> {formatMoney(resumenConfirmacion.efectivo)}</div>
                  <div><strong>Transferencia:</strong> {formatMoney(resumenConfirmacion.transferencia)}</div>
                  <div><strong>Tarjeta:</strong> {formatMoney(resumenConfirmacion.tarjeta)}</div>
                  <div><strong>Otros:</strong> {formatMoney(resumenConfirmacion.otros)}</div>
                  <div><strong>Ingresos:</strong> {formatMoney(resumenConfirmacion.ingresos)}</div>
                  <div><strong>Estado:</strong> {turnoEstadoLabel || '-'}</div>
                </div>
              </div>
            ) : null}

            {turnoLiquidado && liquidacion ? (
              <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                <p className="font-semibold">Turno liquidado y congelado para reporting</p>
                <p className="mt-1">Liquidado el {formatDate(liquidacion.fechaCierre || liquidacion.updatedAt)} por {liquidacion.liquidadoPor || liquidacion.operadorCierreId || '-'}</p>
                <p className="mt-1">Saldo teórico: {formatMoney(liquidacion.saldoTeorico)} · Diferencia de caja: {formatMoney(liquidacion.diferenciaCaja)}</p>
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-3">
              {turnoAbierto ? (
                <>
                  <button
                    disabled
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-400 cursor-not-allowed"
                    title="El cierre manual quedó reemplazado por la liquidación integral del turno"
                  >
                    Cerrar turno administrativo
                  </button>

                  <button
                    disabled={loadingLiquidar || !turno?._id}
                    onClick={async () => {
                      try {
                        const ok = window.confirm(`Vas a liquidar/cerrar el turno administrativo.\n\nTickets: ${resumenConfirmacion?.tickets ?? 0}\nOperaciones: ${resumenConfirmacion?.operaciones ?? 0}\nEfectivo: ${formatMoney(resumenConfirmacion?.efectivo)}\nTransferencia: ${formatMoney(resumenConfirmacion?.transferencia)}\nTarjeta: ${formatMoney(resumenConfirmacion?.tarjeta)}\nOtros: ${formatMoney(resumenConfirmacion?.otros)}\nSaldo teórico: ${formatMoney(resumenConfirmacion?.saldo)}\n\nDespués de liquidar no se podrán registrar más operaciones.`);
                        if (!ok) return;
                        const result = await liquidar({ operatorId: (session?.user as { id?: string } | undefined)?.id ?? '', observacion: 'Liquidación administrativa cerrada desde panel owner/admin' });
                        if (!result) throw new Error('No se pudo liquidar el turno');
                        alert('Turno liquidado y cerrado.');
                      } catch (e: any) {
                        console.error('[ADMIN-TURNOPANEL] liquidar failed', e);
                        alert(e?.message || 'Error al liquidar turno');
                      }
                    }}
                    className="rounded-xl border border-green-300 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loadingLiquidar ? 'Liquidando...' : 'Cerrar / Liquidar turno'}
                  </button>

                  <button disabled={loadingCobro || !turnoAbierto} onClick={async () => {
                    const monto = Number(prompt('Monto cobrado (ej: 100)') || 0);
                    if (monto <= 0) return;
                    try {
                      const r = await registrarCobro({ turnoId: turno._id, monto, paymentMethod: 'efectivo' });
                      if (!r) throw new Error('No se pudo registrar el cobro');
                      alert('Cobro registrado.');
                    } catch (e: any) {
                      console.error('[ADMIN-TURNOPANEL] registrarCobro failed', e);
                      if (!turno?._id) return alert('No hay turno disponible');
                      try {
                        const res = await fetch('/api/v2/billing/admin-cash/transaction', {
                          method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
                          body: JSON.stringify({ turnoId: turno._id, monto, paymentMethod: 'efectivo' }),
                        });
                        const data = await res.json().catch(() => ({}));
                        if (!res.ok) throw new Error(data?.error || data?.message || 'Error al registrar cobro');
                        alert('Cobro registrado (fallback).');
                        await fetchBillingDocs();
                      } catch (e2: any) {
                        console.error('[ADMIN-TURNOPANEL] fallback registrarCobro failed', e2);
                        alert(e2?.message || 'Error al registrar cobro');
                      }
                    }
                  }} className="rounded-xl border border-gray-300 bg-gray-200 px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50">Registrar cobro admin</button>
                </>
              ) : null}

              {turnoLiquidado ? (
                <button disabled className="rounded-xl border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-500 cursor-not-allowed">
                  Turno liquidado · operaciones bloqueadas
                </button>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            <h4 className="text-base font-bold text-gray-900">Facturas y acreditaciones (acción bajo turno)</h4>
            {!turnoAbierto ? <p className="mt-2 text-xs text-amber-700">Las acciones de cobro quedan deshabilitadas cuando el turno administrativo está liquidado.</p> : null}
            {loadingBillingDocs ? <p className="text-sm text-gray-500">Cargando facturas...</p> : (
              <BillingDocumentsList billingDocumentsByPeriod={billingDocumentsByPeriod} acreditarDocumento={turnoAbierto ? acreditarDocumento : async () => {}} marcarDocumento={turnoAbierto ? marcarDocumento : async () => {}} />
            )}
          </div>

        </div>
      ) : (
        <div className="dashboard-section p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900">Sin turno administrativo abierto</h3>
          <p className="mt-2 text-sm text-gray-500">Abrí un turno administrativo para comenzar a registrar cobros.</p>
          <button disabled={loadingOpen} onClick={abrirTurno} className="mt-5 rounded-xl border border-gray-300 bg-gray-200 px-5 py-3 font-semibold text-gray-800 hover:bg-gray-300">Abrir Turno administrativo</button>
          {error ? <p className="mt-3 text-red-600">{error}</p> : null}
        </div>
      )}
    </div>
  );
};

export default AdminTurnoPanel;
