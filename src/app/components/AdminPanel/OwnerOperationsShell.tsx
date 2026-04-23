'use client';

import { useEffect, useMemo, useState } from 'react';
import PanelAbonados from '@/app/components/AdminPanel/PanelAbonados';
import PanelFacturacion from '@/app/components/AdminPanel/PanelFacturacion';
import PanelHistoricoCajas from '@/app/components/AdminPanel/PanelHistoricoCajas';
import ParkingBillingProfilePanel from '@/app/components/AdminPanel/AdminParking/ParkingBillingProfilePanel';
import OwnerOperationsSummary from '@/app/components/AdminPanel/OwnerOperationsSummary';
import OwnerCollectionsPanel from '@/app/components/AdminPanel/OwnerCollectionsPanel';
import PreOperativeView from '@/app/components/AdminPanel/PreOperativeView';
import { OwnerOperationsProvider, useOwnerOperations } from '@/app/components/AdminPanel/OwnerOperationsContext';
import { useParkingLots } from '@/modules/parking/hooks/useParkingLots';
import type { TabKey } from '@/interfaces/admin';

type AdminCashTurno = {
  _id?: string;
  id?: string;
  assignedParking?: string;
  parkinglotId?: string;
  numeroCaja?: number | null;
  cajaNumero?: number | null;
  estado?: string;
};

type OperationalState = 'pre-operativo' | 'operativo';

type DocumentsSummary = {
  total: number;
  paid: number;
  pending: number;
  overdue: number;
};

const STATE_META: Record<OperationalState, { label: string; summary: string; badge: string; primaryAction: string; secondaryAction: string }> = {
  'pre-operativo': {
    label: 'Pre-operativo',
    summary: 'La jornada todavía no empezó. Primero definí playa e iniciá el turno.',
    badge: 'border-amber-200 bg-amber-50 text-amber-800',
    primaryAction: 'Iniciar turno',
    secondaryAction: 'Revisar preparación',
  },
  operativo: {
    label: 'Operativo',
    summary: 'La jornada está activa. Priorizá cobranzas y facturación operativa.',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    primaryAction: 'Operar jornada',
    secondaryAction: 'Monitorear soporte e histórico',
  },
};

function SectionBlock({ title, description, children, tone = 'default', compact = false }: { title: string; description: string; children: React.ReactNode; tone?: 'default' | 'primary' | 'secondary' | 'muted'; compact?: boolean }) {
  const toneClass = tone === 'primary'
    ? 'border-emerald-200 bg-emerald-50/40'
    : tone === 'secondary'
      ? 'border-blue-200 bg-blue-50/30'
      : tone === 'muted'
        ? 'border-gray-200 bg-gray-50'
        : 'border-gray-200 bg-white';
  return (
    <section className={`rounded-3xl ${toneClass} p-5 md:p-6 space-y-5`}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{title}</p>
        <p className={`mt-2 ${compact ? 'text-xs text-gray-500' : 'text-sm text-gray-600'}`}>{description}</p>
      </div>
      {children}
    </section>
  );
}

function OperationalHeader({ loading, error, onRefresh, onCloseTurno }: { loading: boolean; error: string | null; onRefresh: () => void; onCloseTurno: () => Promise<void> | void; }) {
  const ctx = useOwnerOperations();
  const snapshot = ctx?.operationalSnapshot;
  const state = snapshot?.operationalState || 'pre-operativo';
  const stateMeta = STATE_META[state];

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 md:p-6 space-y-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Owner Operations Shell</p>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">Flujo operativo state-driven</h2>
            <p className="mt-1 text-sm text-gray-600">{stateMeta.summary}</p>
          </div>
        </div>
        <div className={`inline-flex rounded-full border px-4 py-2 text-sm font-semibold ${stateMeta.badge}`}>
          Estado actual: {stateMeta.label}
        </div>
      </div>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Info label="Playa activa" value={snapshot?.activeParkingId || 'Sin playa activa'} />
          <Info label="Caja activa" value={snapshot?.activeCajaNumero || 'Sin caja activa'} />
          <Info label="Turno activo" value={snapshot?.activeTurnoId || 'Sin turno activo'} />
          <Info label="Estado" value={stateMeta.label} />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Acciones primarias</p>
          <div className="flex flex-wrap gap-3">
            <button onClick={onRefresh} className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50" disabled={loading}>
              {loading ? 'Verificando...' : 'Verificar estado'}
            </button>
            {state === 'operativo' ? (
              <button onClick={() => void onCloseTurno()} className="rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100" disabled={loading}>
                Cerrar caja/turno actual
              </button>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700">
                Estado no transaccional / consulta.
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500">Acción secundaria sugerida: {stateMeta.secondaryAction}.</p>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function DocumentsModule({ selectedParkingId }: { selectedParkingId: string }) {
  const ctx = useOwnerOperations();
  const [summary, setSummary] = useState<DocumentsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const operationalState = ctx?.operationalState || 'pre-operativo';

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        if (selectedParkingId) params.set('parkinglotId', selectedParkingId);
        const res = await fetch(`/api/v2/billing/documents${params.toString() ? `?${params.toString()}` : ''}`);
        const data = await res.json().catch(() => ([]));
        const docs = Array.isArray(data) ? data : [];
        const total = docs.length;
        const paid = docs.filter((d: any) => d.estado === 'pagada').length;
        const pending = docs.filter((d: any) => d.estado === 'emitida' || d.estado === 'pendiente').length;
        const overdue = docs.filter((d: any) => d.estado === 'vencida').length;
        setSummary({ total, paid, pending, overdue });
      } catch (err: any) {
        setError(err.message || 'No se pudo cargar el resumen de documentos.');
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [selectedParkingId, ctx?.refreshToken]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Documentos</h3>
          <p className="mt-1 text-sm text-gray-600">Resumen separado de facturación, sin duplicar el flujo operativo.</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${operationalState === 'operativo' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-700'}`}>
          {operationalState === 'operativo' ? 'Operativo' : 'Consulta'}
        </span>
      </div>
      {loading ? <p className="text-sm text-gray-500">Cargando documentos…</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {summary ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <Info label="Total" value={String(summary.total)} />
          <Info label="Pagados" value={String(summary.paid)} />
          <Info label="Pendientes" value={String(summary.pending)} />
          <Info label="Vencidos" value={String(summary.overdue)} />
        </div>
      ) : null}
    </div>
  );
}

function InnerOwnerOperationsShell({ ownerId }: { ownerId: string }) {
  const { parkings, loading } = useParkingLots();
  const ctx = useOwnerOperations();
  const selectedParkingId = ctx?.selectedParkingId || '';
  const setSelectedParkingId = ctx?.setSelectedParkingId || (() => {});
  const bumpRefreshToken = ctx?.bumpRefreshToken || (() => {});
  const operationalSnapshot = ctx?.operationalSnapshot;
  const setOperationalSnapshot = ctx?.setOperationalSnapshot || (() => {});
  const operationalState = ctx?.operationalState || 'pre-operativo';
  const statusMessage = ctx?.statusMessage ?? null;
  const [operationalLoading, setOperationalLoading] = useState(false);
  const [operationalError, setOperationalError] = useState<string | null>(null);

  const ownerParkings = useMemo(
    () => parkings.filter((parking) => String(parking.owner || '') === String(ownerId)),
    [parkings, ownerId]
  );

  const refreshOperationalSnapshot = async () => {
    try {
      setOperationalLoading(true);
      setOperationalError(null);
      const url = selectedParkingId ? `/api/v2/billing/admin-cash?parkinglotId=${encodeURIComponent(selectedParkingId)}` : '/api/v2/billing/admin-cash';
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo obtener el estado operativo');
      const turno = (data?.turno ?? null) as AdminCashTurno | null;
      const nextState: OperationalState = turno?._id || turno?.id ? 'operativo' : 'pre-operativo';
      setOperationalSnapshot({
        activeParkingId: String(turno?.parkinglotId ?? turno?.assignedParking ?? selectedParkingId ?? ''),
        activeCajaNumero: turno ? String(turno.numeroCaja ?? turno.cajaNumero ?? '') : '',
        activeTurnoId: turno ? String(turno._id ?? turno.id ?? '') : '',
        turnoEstado: turno ? String(turno.estado ?? '') : '',
        operationalState: nextState,
        resolved: true,
      });
    } catch (err: any) {
      setOperationalError(err.message || 'Error desconocido');
      setOperationalSnapshot({
        activeParkingId: selectedParkingId,
        activeCajaNumero: '',
        activeTurnoId: '',
        turnoEstado: '',
        operationalState: 'pre-operativo',
        resolved: true,
      });
    } finally {
      setOperationalLoading(false);
    }
  };

  const selectedParkingName = useMemo(
    () => ownerParkings.find((parking) => String(parking._id) === String(selectedParkingId))?.name ?? '',
    [ownerParkings, selectedParkingId]
  );

  useEffect(() => {
    void refreshOperationalSnapshot();
  }, [selectedParkingId, ctx?.refreshToken]);

  const closeTurno = async () => {
    if (!operationalSnapshot?.activeTurnoId) return;
    try {
      setOperationalLoading(true);
      setOperationalError(null);
      const res = await fetch('/api/v2/billing/admin-cash', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ turnoId: operationalSnapshot.activeTurnoId, action: 'close' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo cerrar el turno');
      setOperationalSnapshot({
        activeParkingId: selectedParkingId,
        activeCajaNumero: '',
        activeTurnoId: '',
        turnoEstado: '',
        operationalState: 'pre-operativo',
        resolved: true,
      });
      ctx?.setStatusMessage?.({ type: 'success', text: 'Turno cerrado. El shell volvió a pre-operativo.' });
      ctx?.bumpRefreshToken?.();
    } catch (err: any) {
      setOperationalError(err.message || 'Error desconocido');
      ctx?.setStatusMessage?.({ type: 'error', text: err.message || 'No se pudo cerrar el turno.' });
    } finally {
      setOperationalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {operationalSnapshot?.resolved ? (
        <OperationalHeader loading={operationalLoading} error={operationalError} onRefresh={() => void refreshOperationalSnapshot()} onCloseTurno={closeTurno} />
      ) : null}

      {statusMessage ? (
        <div className={`rounded-2xl border p-4 text-sm ${statusMessage.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : statusMessage.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-blue-200 bg-blue-50 text-blue-800'}`}>
          {statusMessage.text}
        </div>
      ) : null}

      {operationalState === 'pre-operativo' ? (
        <SectionBlock title="Operación" description="Antes de usar herramientas operativas, iniciá el turno de la jornada." tone="primary">
          <PreOperativeView
            selectedParkingId={selectedParkingId}
            parkingName={selectedParkingName}
            parkingOptions={ownerParkings.map((parking) => ({ _id: parking._id, name: parking.name }))}
            onParkingChange={(value) => { setSelectedParkingId(value); bumpRefreshToken(); }}
            parkingSelectorDisabled={loading || operationalLoading}
            onOpened={() => {
              bumpRefreshToken();
            }}
          />
        </SectionBlock>
      ) : null}

      {operationalState === 'operativo' ? (
        <>
          <SectionBlock title="Operación" description="Herramientas críticas de la jornada. Primero cobranzas y facturación operativa." tone="primary">
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <OwnerCollectionsPanel selectedParkingId={selectedParkingId} />
              <PanelFacturacion />
            </div>
          </SectionBlock>

          <SectionBlock title="Soporte" description="Módulos importantes, pero no críticos en tiempo real. Sin duplicaciones ni accesos paralelos." tone="secondary">
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
              <PanelAbonados />
              <DocumentsModule selectedParkingId={selectedParkingId} />
              <ParkingBillingProfilePanel ownerId={ownerId} />
            </div>
          </SectionBlock>

          <SectionBlock title="Control" description="KPIs y resumen ejecutivo para leer el estado operativo sin distraer la ejecución principal." compact>
            <OwnerOperationsSummary selectedParkingId={selectedParkingId} />
          </SectionBlock>

          <SectionBlock title="Histórico" description="Cierres, auditoría e histórico como último nivel de navegación operativa." tone="muted" compact>
            <PanelHistoricoCajas />
          </SectionBlock>
        </>
      ) : null}
    </div>
  );
}

export default function OwnerOperationsShell({ ownerId }: { ownerId: string; activeTab?: TabKey; setActiveTab?: (key: TabKey) => void }) {
  return (
    <OwnerOperationsProvider>
      <InnerOwnerOperationsShell ownerId={ownerId} />
    </OwnerOperationsProvider>
  );
}
