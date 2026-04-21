'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { adaptTurnoFromLegacy } from '@/modules/turnos/adapters/turnoViewModel.adapter';

type CajaOnlineItem = {
  _id: string;
  parkinglotId: string;
  code: string;
  displayName: string;
  numero: number;
  tipo: string;
  activa: boolean;
  turnoAbierto: null | {
    _id: string;
    cajaCode: string;
    fechaApertura?: string;
    esCajaAdministrativa: boolean;
    totalTurno: number;
    operatorId: string;
    operatorName: string;
    operatorEmail: string;
  };
  metrics: {
    movimientos: number;
    total: number;
    efectivo: number;
    tarjeta: number;
    qr: number;
    otros: number;
  };
  latestMovements: Array<{
    _id: string;
    sourceType: string;
    sourceId: string;
    amount: number;
    paymentMethod: string;
    paymentReference: string;
    status: string;
    createdAt?: string;
    snapshot?: Record<string, unknown>;
  }>;
};

type ParkingOption = {
  _id: string;
  name: string;
};

const EMPTY_METRICS: CajaOnlineItem['metrics'] = {
  movimientos: 0,
  total: 0,
  efectivo: 0,
  tarjeta: 0,
  qr: 0,
  otros: 0,
};

function formatMoney(value?: number) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toUTCString();
}

const USE_TURNO_VIEW_MODEL_V2 = typeof process !== 'undefined' && process?.env?.NEXT_PUBLIC_USE_TURNO_VIEW_MODEL_V2 === 'true';

function normalizeTurnoAbiertoLegacy(it: Record<string, unknown>) {
  if (it.turnoAbierto && typeof it.turnoAbierto === 'object') {
    return it.turnoAbierto as CajaOnlineItem['turnoAbierto'];
  }

  if (!it.turnoId) {
    return null;
  }

  const turno = (it.turno && typeof it.turno === 'object') ? (it.turno as Record<string, unknown>) : null;

  return {
    _id: String(it.turnoId),
    cajaCode: typeof it.code === 'string' ? it.code : '',
    fechaApertura: typeof turno?.fechaApertura === 'string' ? turno.fechaApertura : undefined,
    esCajaAdministrativa: Boolean(turno?.esCajaAdministrativa),
    totalTurno: typeof turno?.totalTurno === 'number' ? turno.totalTurno : 0,
    operatorId: typeof turno?.operatorId === 'string' ? turno.operatorId : '',
    operatorName: typeof turno?.operatorName === 'string' ? turno.operatorName : '',
    operatorEmail: typeof turno?.operatorEmail === 'string' ? turno.operatorEmail : '',
  };
}

function normalizeTurnoAbiertoViewModel(it: Record<string, unknown>) {
  if (it.turnoAbierto && typeof it.turnoAbierto === 'object') {
    const vm = adaptTurnoFromLegacy(it.turnoAbierto);
    if (!vm) return it.turnoAbierto as CajaOnlineItem['turnoAbierto'];
    return {
      _id: vm.turnoId,
      cajaCode: vm.caja.cajaCode ?? (typeof it.code === 'string' ? it.code : ''),
      fechaApertura: vm.openedAt,
      esCajaAdministrativa: vm.caja.esAdministrativa,
      totalTurno: vm.totalCobrado,
      operatorId: vm.operador.operatorId ?? '',
      operatorName: vm.operador.operatorName ?? '',
      operatorEmail: vm.operador.operatorEmail ?? '',
    };
  }

  if (!it.turnoId) {
    return null;
  }

  const vm = adaptTurnoFromLegacy({
    _id: it.turnoId,
    cajaCode: it.code,
    ...(it.turno && typeof it.turno === 'object' ? (it.turno as Record<string, unknown>) : {}),
  });

  if (!vm) {
    return normalizeTurnoAbiertoLegacy(it);
  }

  return {
    _id: vm.turnoId,
    cajaCode: vm.caja.cajaCode ?? (typeof it.code === 'string' ? it.code : ''),
    fechaApertura: vm.openedAt,
    esCajaAdministrativa: vm.caja.esAdministrativa,
    totalTurno: vm.totalCobrado,
    operatorId: vm.operador.operatorId ?? '',
    operatorName: vm.operador.operatorName ?? '',
    operatorEmail: vm.operador.operatorEmail ?? '',
  };
}

function normalizeCajaOnlineItem(item: unknown): CajaOnlineItem {
  const it = (item && typeof item === 'object') ? (item as Record<string, unknown>) : {};
  const metrics = (it.metrics && typeof it.metrics === 'object') ? (it.metrics as Record<string, unknown>) : {};
  const latestMovementsRaw = Array.isArray(it.latestMovements) ? it.latestMovements : [];

  return {
    _id: String(it._id ?? it.id ?? it.code ?? crypto.randomUUID()),
    parkinglotId: String(it.parkinglotId ?? ''),
    code: String(it.code ?? ''),
    displayName: String(it.displayName ?? it.code ?? 'Caja'),
    numero: Number(it.numero ?? 0),
    tipo: String(it.tipo ?? '-'),
    activa: Boolean(it.activa ?? false),
    turnoAbierto: USE_TURNO_VIEW_MODEL_V2 ? normalizeTurnoAbiertoViewModel(it) : normalizeTurnoAbiertoLegacy(it),
    metrics: {
      movimientos: Number(metrics.movimientos ?? EMPTY_METRICS.movimientos),
      total: Number(metrics.total ?? EMPTY_METRICS.total),
      efectivo: Number(metrics.efectivo ?? EMPTY_METRICS.efectivo),
      tarjeta: Number(metrics.tarjeta ?? EMPTY_METRICS.tarjeta),
      qr: Number(metrics.qr ?? EMPTY_METRICS.qr),
      otros: Number(metrics.otros ?? EMPTY_METRICS.otros),
    },
    latestMovements: latestMovementsRaw.map((mov) => {
      const m = (mov && typeof mov === 'object') ? (mov as Record<string, unknown>) : {};
      const snapshot = (m.snapshot && typeof m.snapshot === 'object') ? (m.snapshot as Record<string, unknown>) : undefined;
      return {
        _id: String(m._id ?? m.id ?? crypto.randomUUID()),
        sourceType: String(m.sourceType ?? '-'),
        sourceId: String(m.sourceId ?? ''),
        amount: Number(m.amount ?? 0),
        paymentMethod: String(m.paymentMethod ?? ''),
        paymentReference: String(m.paymentReference ?? ''),
        status: String(m.status ?? ''),
        createdAt: typeof m.createdAt === 'string' ? m.createdAt : undefined,
        snapshot,
      };
    }),
  };
}

export default function PanelCajasOnline() {
  const [items, setItems] = useState<CajaOnlineItem[]>([]);
  const [parkings, setParkings] = useState<ParkingOption[]>([]);
  const [parkinglotId, setParkinglotId] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchParkings = useCallback(async () => {
    try {
      const res = await fetch('/api/v2/billing/parkings', { cache: 'no-store', credentials: 'include' });
      const contentType = res.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await res.json() : null;
      if (!res.ok) throw new Error(data?.error || 'No se pudieron cargar las playas');
      setParkings(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Error cargando playas');
    }
  }, []);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (parkinglotId) params.set('parkinglotId', parkinglotId);
      const res = await fetch(`/api/v2/cajas/online${params.toString() ? `?${params.toString()}` : ''}`, { cache: 'no-store', credentials: 'include' });
      const contentType = res.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await res.json() : null;
      if (!res.ok) throw new Error(data?.error || 'No se pudo cargar la auditoría online');
      const rawItems = Array.isArray(data?.items) ? data.items : (Array.isArray(data?.cajas) ? data.cajas : []);
      const normalized: CajaOnlineItem[] = rawItems.map(normalizeCajaOnlineItem);
      const unique: CajaOnlineItem[] = Array.from(
        new Map(normalized.map((item: CajaOnlineItem) => [item._id, item])).values(),
      );
      setItems(unique);
    } catch (err: any) {
      setError(err.message || 'Error cargando cajas online');
    } finally {
      setLoading(false);
    }
  }, [parkinglotId]);

  useEffect(() => {
    void fetchParkings();
  }, [fetchParkings]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch = !term || `${item.code} ${item.displayName} ${item.turnoAbierto?.operatorName ?? ''} ${item.turnoAbierto?.operatorEmail ?? ''}`.toLowerCase().includes(term);
      const matchesStatus = statusFilter === 'all'
        ? true
        : statusFilter === 'open'
          ? Boolean(item.turnoAbierto)
          : !item.turnoAbierto;
      return matchesSearch && matchesStatus;
    });
  }, [items, search, statusFilter]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Auditoría online de cajas</h3>
          <p className="mt-1 text-sm text-gray-500">Visibilidad en tiempo real por caja, turno abierto, métricas y últimos movimientos.</p>
        </div>
        <button type="button" onClick={() => void fetchItems()} disabled={loading} className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60">
          {loading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <select value={parkinglotId} onChange={(e) => setParkinglotId(e.target.value)} className="rounded-xl border border-gray-300 bg-white px-4 py-3">
          <option value="">Todas las playas</option>
          {parkings.map((parking) => (
            <option key={parking._id} value={parking._id}>{parking.name}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | 'open' | 'closed')} className="rounded-xl border border-gray-300 bg-white px-4 py-3">
          <option value="all">Todas las cajas</option>
          <option value="open">Con turno abierto</option>
          <option value="closed">Sin turno abierto</option>
        </select>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por código u operador" className="rounded-xl border border-gray-300 px-4 py-3" />
      </div>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      {!loading && !filteredItems.length ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">
          No hay cajas para los filtros seleccionados.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <div key={item._id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-lg font-bold text-gray-900">{item.displayName || item.code}</h4>
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${item.turnoAbierto ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'}`}>
                      {item.turnoAbierto ? 'Turno abierto' : 'Sin turno abierto'}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{item.tipo}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-sm text-gray-600 md:grid-cols-2">
                    <p><strong>Código:</strong> {item.code || '-'}</p>
                    <p><strong>Número:</strong> {item.numero || '-'}</p>
                    <p><strong>Operador:</strong> {item.turnoAbierto?.operatorName || item.turnoAbierto?.operatorEmail || '-'}</p>
                    <p><strong>Apertura:</strong> {formatDate(item.turnoAbierto?.fechaApertura)}</p>
                    <p><strong>Total turno:</strong> {formatMoney(item.turnoAbierto?.totalTurno ?? 0)}</p>
                    <p><strong>Movimientos:</strong> {item.metrics.movimientos}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-5 lg:min-w-[520px]">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm"><div className="text-gray-500">Total</div><div className="mt-1 font-bold text-gray-900">{formatMoney(item.metrics.total)}</div></div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm"><div className="text-gray-500">Efectivo</div><div className="mt-1 font-bold text-gray-900">{formatMoney(item.metrics.efectivo)}</div></div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm"><div className="text-gray-500">Tarjeta</div><div className="mt-1 font-bold text-gray-900">{formatMoney(item.metrics.tarjeta)}</div></div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm"><div className="text-gray-500">QR</div><div className="mt-1 font-bold text-gray-900">{formatMoney(item.metrics.qr)}</div></div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm"><div className="text-gray-500">Otros</div><div className="mt-1 font-bold text-gray-900">{formatMoney(item.metrics.otros)}</div></div>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button type="button" onClick={() => setExpandedId((current) => current === item._id ? null : item._id)} className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                  {expandedId === item._id ? 'Ocultar movimientos' : 'Ver movimientos'}
                </button>
              </div>

              {expandedId === item._id ? (
                <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  {!item.latestMovements.length ? (
                    <p className="text-sm text-gray-500">No hay movimientos recientes para esta caja.</p>
                  ) : (
                    <div className="space-y-3">
                      {item.latestMovements.map((mov) => (
                        <div key={mov._id} className="rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-700">
                          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                              <p className="font-semibold text-gray-900">{mov.sourceType} · {formatMoney(mov.amount)}</p>
                              <p className="text-xs text-gray-500">{formatDate(mov.createdAt)}</p>
                            </div>
                            <div className="text-xs text-gray-500">{mov.status || '-'}</div>
                          </div>
                          <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                            <p><strong>Método:</strong> {mov.paymentMethod || '-'}</p>
                            <p><strong>Referencia:</strong> {mov.paymentReference || '-'}</p>
                            <p><strong>Origen:</strong> {mov.sourceId || '-'}</p>
                            <p><strong>Detalle:</strong> {String((mov.snapshot?.ticketNumber as string) || (mov.snapshot?.invoiceCode as string) || (mov.snapshot?.abonadoNombre as string) || '-')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
