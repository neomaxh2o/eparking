'use client';

import { useEffect, useMemo, useState } from 'react';
import PanelAbonados from '@/app/components/AdminPanel/PanelAbonados';
import PanelFacturacion from '@/app/components/AdminPanel/PanelFacturacion';
import PanelCajasOnline from '@/app/components/AdminPanel/PanelCajasOnline';
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
  operatorId?: string;
  operatorName?: string;
};

type OperationalState = 'pre-operativo' | 'operativo' | 'post-cierre';
type ShellSection = 'preparacion' | 'operacion' | 'control';

type SectionConfig = {
  key: TabKey;
  label: string;
  section: ShellSection;
  description: string;
  states: OperationalState[];
  emphasis?: 'primary' | 'secondary';
  content: React.ReactNode;
};

const SECTION_META: Record<ShellSection, { label: string; description: string }> = {
  preparacion: {
    label: 'Preparación',
    description: 'Abrir jornada, revisar base operativa y dejar la playa lista.',
  },
  operacion: {
    label: 'Operación',
    description: 'Ejecutar la jornada activa con foco en transacciones y seguimiento.',
  },
  control: {
    label: 'Control',
    description: 'Validar, auditar y preparar el siguiente ciclo operativo.',
  },
};

const STATE_META: Record<OperationalState, { label: string; summary: string; badge: string; recommendedTab: TabKey; primaryAction: string; secondaryAction: string }> = {
  'pre-operativo': {
    label: 'Pre-operativo',
    summary: 'La jornada todavía no empezó. Primero definí playa y abrí caja/turno.',
    badge: 'border-amber-200 bg-amber-50 text-amber-800',
    recommendedTab: 'facturacion',
    primaryAction: 'Abrir operación',
    secondaryAction: 'Revisar preparación',
  },
  operativo: {
    label: 'Operativo',
    summary: 'La jornada está activa. Priorizá facturación, cobranzas y monitoreo de cajas.',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    recommendedTab: 'reservations',
    primaryAction: 'Gestionar operación',
    secondaryAction: 'Monitorear cajas',
  },
  'post-cierre': {
    label: 'Post-cierre',
    summary: 'La operación quedó cerrada. Ahora manda el control, fiscal e histórico.',
    badge: 'border-slate-200 bg-slate-100 text-slate-700',
    recommendedTab: 'historico-cajas',
    primaryAction: 'Controlar cierre',
    secondaryAction: 'Preparar nueva jornada',
  },
};

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
          <Info label="Playa" value={snapshot?.activeParkingId || 'Sin playa activa'} />
          <Info label="Caja" value={snapshot?.activeCajaNumero || 'Sin caja activa'} />
          <Info label="Turno" value={snapshot?.activeTurnoId || 'Sin turno activo'} />
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

function SectionCard({
  section,
  state,
  items,
  activeTab,
  onSelect,
}: {
  section: ShellSection;
  state: OperationalState;
  items: SectionConfig[];
  activeTab: TabKey;
  onSelect: (key: TabKey) => void;
}) {
  const meta = SECTION_META[section];
  const stateMeta = STATE_META[state];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">{meta.label}</p>
        <p className="mt-1 text-sm text-gray-600">{meta.description}</p>
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const enabled = item.states.includes(state);
          const isActive = activeTab === item.key;
          const isRecommended = stateMeta.recommendedTab === item.key;

          return (
            <button
              key={item.key}
              onClick={() => enabled && onSelect(item.key)}
              disabled={!enabled}
              className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                isActive
                  ? 'border-gray-900 bg-gray-900 text-white shadow-sm'
                  : enabled
                    ? isRecommended
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                      : item.emphasis === 'primary'
                        ? 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
                        : 'border-gray-200 bg-gray-50 text-gray-800 hover:bg-gray-100'
                    : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{item.label}</p>
                  <p className={`mt-1 text-xs ${isActive ? 'text-gray-200' : enabled ? 'text-gray-500' : 'text-gray-400'}`}>{item.description}</p>
                </div>
                {isRecommended && enabled ? <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${isActive ? 'bg-white/15 text-white' : 'bg-white text-emerald-700 border border-emerald-200'}`}>Prioridad</span> : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function InnerOwnerOperationsShell({ ownerId, activeTab, setActiveTab }: { ownerId: string; activeTab: TabKey; setActiveTab: (key: TabKey) => void }) {
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
      const nextState: OperationalState = turno?._id || turno?.id ? 'operativo' : ((operationalSnapshot?.operationalState === 'post-cierre') ? 'post-cierre' : 'pre-operativo');
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
        operationalState: operationalSnapshot?.operationalState === 'post-cierre' ? 'post-cierre' : 'pre-operativo',
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

  const sections = useMemo<SectionConfig[]>(() => [
    {
      key: 'facturacion',
      label: 'Iniciar turno',
      section: 'preparacion',
      description: 'Abrir caja/turno y pasar de preparación a operación real.',
      states: ['pre-operativo', 'post-cierre', 'operativo'],
      emphasis: 'primary',
      content: <PanelFacturacion />,
    },
    {
      key: 'users',
      label: 'Estado actual',
      section: 'preparacion',
      description: 'Resumen ejecutivo del owner y de la playa filtrada.',
      states: ['pre-operativo', 'operativo', 'post-cierre'],
      content: <OwnerOperationsSummary selectedParkingId={selectedParkingId} />,
    },
    {
      key: 'abonados',
      label: 'Herramientas comerciales',
      section: 'preparacion',
      description: 'Abonados, altas y preparación comercial sin depender del cierre.',
      states: ['pre-operativo', 'operativo', 'post-cierre'],
      content: <PanelAbonados />,
    },
    {
      key: 'reservations',
      label: 'Cobranzas',
      section: 'operacion',
      description: 'Cobros y seguimiento operativo en jornada activa.',
      states: ['operativo'],
      emphasis: 'primary',
      content: <OwnerCollectionsPanel selectedParkingId={selectedParkingId} />,
    },
    {
      key: 'historico-cajas',
      label: 'Cajas e histórico',
      section: 'control',
      description: 'Monitoreo de cajas online e histórico de cierres.',
      states: ['pre-operativo', 'operativo', 'post-cierre'],
      emphasis: 'primary',
      content: <div className="space-y-6"><PanelCajasOnline /><PanelHistoricoCajas /></div>,
    },
    {
      key: 'tarifas',
      label: 'Fiscal y control',
      section: 'control',
      description: 'Configuración fiscal, validaciones y soporte al cierre.',
      states: ['pre-operativo', 'operativo', 'post-cierre'],
      content: <ParkingBillingProfilePanel ownerId={ownerId} />,
    },
  ], [ownerId, operationalState, selectedParkingId]);

  const accessibleTabs = new Set<TabKey>(sections.filter((item) => item.states.includes(operationalState)).map((item) => item.key));
  const recommendedTab = STATE_META[operationalState].recommendedTab;
  const safeActiveTab = accessibleTabs.has(activeTab) ? activeTab : recommendedTab;

  useEffect(() => {
    if (activeTab !== safeActiveTab) {
      setActiveTab(safeActiveTab);
    }
  }, [activeTab, safeActiveTab, setActiveTab]);

  const workArea = (() => {
    if ((operationalState === 'pre-operativo' || operationalState === 'post-cierre') && safeActiveTab === 'facturacion') {
      return (
        <PreOperativeView
          selectedParkingId={selectedParkingId}
          parkingName={selectedParkingName}
          parkingOptions={ownerParkings.map((parking) => ({ _id: parking._id, name: parking.name }))}
          onParkingChange={(value) => { setSelectedParkingId(value); bumpRefreshToken(); }}
          parkingSelectorDisabled={loading || operationalLoading}
          onOpened={() => {
            bumpRefreshToken();
            setActiveTab('reservations');
          }}
        />
      );
    }

    if (operationalState !== 'operativo' && safeActiveTab === 'reservations') {
      return (
        <BlockedState
          title={operationalState === 'post-cierre' ? 'Operación cerrada' : 'Operación todavía no iniciada'}
          description={operationalState === 'post-cierre'
            ? 'La jornada ya se cerró. Pasá a Control para histórico/fiscal o reiniciá una nueva operación desde Preparación.'
            : 'Las cobranzas se habilitan cuando abrís caja/turno para la playa activa.'}
        />
      );
    }

    return sections.find((item) => item.key === safeActiveTab)?.content;
  })();

  const sectionsByGroup = {
    preparacion: sections.filter((item) => item.section === 'preparacion'),
    operacion: sections.filter((item) => item.section === 'operacion'),
    control: sections.filter((item) => item.section === 'control'),
  };

  const isPreOperativeEntry = operationalState === 'pre-operativo';
  const isClosedEntry = operationalState === 'post-cierre';
  const preOperativePrimary = sections.find((item) => item.key === 'facturacion');

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
      if (!res.ok) throw new Error(data.error || 'No se pudo cerrar la caja administrativa');
      setOperationalSnapshot({
        activeParkingId: selectedParkingId,
        activeCajaNumero: '',
        activeTurnoId: '',
        turnoEstado: '',
        operationalState: 'post-cierre',
        resolved: true,
      });
      ctx?.setStatusMessage?.({ type: 'success', text: 'Caja/turno administrativo cerrado. El shell quedó en modo consulta.' });
      ctx?.bumpRefreshToken?.();
    } catch (err: any) {
      setOperationalError(err.message || 'Error desconocido');
      ctx?.setStatusMessage?.({ type: 'error', text: err.message || 'No se pudo cerrar la caja administrativa.' });
    } finally {
      setOperationalLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {operationalSnapshot?.resolved ? (
        <OperationalHeader loading={operationalLoading} error={operationalError} onRefresh={() => void refreshOperationalSnapshot()} onCloseTurno={closeTurno} />
      ) : null}

      <div className="dashboard-section overflow-hidden p-4 md:p-5 space-y-4">
        {!isPreOperativeEntry && !isClosedEntry ? (
          <>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Playa</label>
                <select value={selectedParkingId} onChange={(e) => { setSelectedParkingId(e.target.value); bumpRefreshToken(); }} className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3" disabled={loading}>
                  <option value="">Todas las playas del owner</option>
                  {ownerParkings.map((parking) => (
                    <option key={parking._id} value={parking._id}>{parking.name}</option>
                  ))}
                </select>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                {selectedParkingId ? 'Filtro global aplicado por playa.' : 'Sin filtro global: mostrando alcance total del owner.'}
              </div>
            </div>

            <div className={`rounded-2xl border px-4 py-3 text-sm ${STATE_META[operationalState].badge}`}>
              {STATE_META[operationalState].summary}
            </div>
          </>
        ) : null}

        {isPreOperativeEntry ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="mb-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Entry point pre-operativo</p>
              <p className="mt-1 text-sm text-amber-900">Sin turno/caja activa, el único menú operativo disponible es iniciar turno.</p>
            </div>
            {preOperativePrimary ? (
              <button
                type="button"
                onClick={() => setActiveTab(preOperativePrimary.key)}
                className="w-full rounded-2xl border border-emerald-300 bg-white px-4 py-4 text-left transition hover:bg-emerald-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{preOperativePrimary.label}</p>
                    <p className="mt-1 text-xs text-gray-600">{preOperativePrimary.description}</p>
                  </div>
                  <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">Único menú</span>
                </div>
              </button>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <SectionCard section="preparacion" state={operationalState} items={sectionsByGroup.preparacion} activeTab={safeActiveTab} onSelect={setActiveTab} />
            <SectionCard section="operacion" state={operationalState} items={sectionsByGroup.operacion} activeTab={safeActiveTab} onSelect={setActiveTab} />
            <SectionCard section="control" state={operationalState} items={sectionsByGroup.control} activeTab={safeActiveTab} onSelect={setActiveTab} />
          </div>
        )}
      </div>

      {statusMessage ? (
        <div className={`rounded-2xl border p-4 text-sm ${statusMessage.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : statusMessage.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-blue-200 bg-blue-50 text-blue-800'}`}>
          {statusMessage.text}
        </div>
      ) : null}

      <div className="dashboard-section p-4 md:p-6">
        {workArea}
      </div>
    </div>
  );
}

function BlockedState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-700">
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      <p className="mt-2">{description}</p>
    </div>
  );
}

export default function OwnerOperationsShell({ ownerId, activeTab, setActiveTab }: { ownerId: string; activeTab: TabKey; setActiveTab: (key: TabKey) => void }) {
  return (
    <OwnerOperationsProvider>
      <InnerOwnerOperationsShell ownerId={ownerId} activeTab={activeTab} setActiveTab={setActiveTab} />
    </OwnerOperationsProvider>
  );
}
