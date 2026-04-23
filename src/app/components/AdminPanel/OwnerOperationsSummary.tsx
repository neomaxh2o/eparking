'use client';

import { useEffect, useMemo, useState } from 'react';

type BillingDoc = {
  _id: string;
  estado?: string;
  monto?: number;
  assignedParking?: string | null;
  fechaPago?: string | null;
};

type CajaOnline = {
  _id: string;
  turnoAbierto?: { _id?: string } | null;
  metrics?: { total?: number };
};

export default function OwnerOperationsSummary({ selectedParkingId }: { selectedParkingId?: string }) {
  const [abonados, setAbonados] = useState<any[]>([]);
  const [docs, setDocs] = useState<BillingDoc[]>([]);
  const [cajas, setCajas] = useState<CajaOnline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        setLoading(true);
        const abonadosParams = new URLSearchParams();
        if (selectedParkingId) abonadosParams.set('assignedParking', selectedParkingId);
        const cajasUrl = selectedParkingId ? `/api/v2/cajas/online?parkinglotId=${encodeURIComponent(selectedParkingId)}` : '/api/v2/cajas/online';

        const [abonadosRes, docsRes, cajasRes] = await Promise.all([
          fetch(`/api/v2/abonados${abonadosParams.toString() ? `?${abonadosParams.toString()}` : ''}`, { cache: 'no-store' }),
          fetch('/api/v2/billing/documents', { cache: 'no-store' }),
          fetch(cajasUrl, { cache: 'no-store' }),
        ]);

        const [abonadosData, docsData, cajasData] = await Promise.all([
          abonadosRes.json().catch(() => []),
          docsRes.json().catch(() => []),
          cajasRes.json().catch(() => ({ items: [] })),
        ]);

        if (!mounted) return;
        setAbonados(Array.isArray(abonadosData) ? abonadosData : []);
        const allDocs = Array.isArray(docsData) ? docsData : [];
        setDocs(selectedParkingId ? allDocs.filter((d) => String(d.assignedParking || '') === String(selectedParkingId)) : allDocs);
        const rawCajas = Array.isArray(cajasData?.items) ? cajasData.items : (Array.isArray(cajasData?.cajas) ? cajasData.cajas : []);
        setCajas(rawCajas);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void run();
    return () => { mounted = false; };
  }, [selectedParkingId]);

  const summary = useMemo(() => {
    const activeAbonados = abonados.filter((a) => a.estado === 'activo').length;
    const pendingDocs = docs.filter((d) => d.estado === 'emitida' || d.estado === 'pendiente').length;
    const overdueDocs = docs.filter((d) => d.estado === 'vencida').length;
    const today = new Date();
    const cobranzasHoy = docs.filter((d) => {
      if (!d.fechaPago) return false;
      const dt = new Date(d.fechaPago);
      return dt.getUTCFullYear() === today.getUTCFullYear() && dt.getUTCMonth() === today.getUTCMonth() && dt.getUTCDate() === today.getUTCDate();
    }).reduce((acc, d) => acc + Number(d.monto || 0), 0);
    const cajasAbiertas = cajas.filter((c) => c.turnoAbierto && c.turnoAbierto._id).length;
    const cajasConAlerta = cajas.filter((c) => Number(c.metrics?.total || 0) === 0 && c.turnoAbierto && c.turnoAbierto._id).length;
    return { activeAbonados, pendingDocs, overdueDocs, cobranzasHoy, cajasAbiertas, cajasConAlerta };
  }, [abonados, docs, cajas]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Resumen operativo</h2>
        <p className="mt-1 text-sm text-gray-500">Vista consolidada del owner para la playa seleccionada y su contexto operativo.</p>
      </div>
      {loading ? <p className="text-sm text-gray-500">Cargando KPIs...</p> : null}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Abonados activos" value={summary.activeAbonados} />
        <KpiCard label="Facturas pendientes" value={summary.pendingDocs} />
        <KpiCard label="Facturas vencidas" value={summary.overdueDocs} />
        <KpiCard label="Cobranzas del día" value={`$${summary.cobranzasHoy.toFixed(2)}`} />
        <KpiCard label="Cajas abiertas" value={summary.cajasAbiertas} />
        <KpiCard label="Cajas con alerta" value={summary.cajasConAlerta} tone="amber" />
      </div>
    </div>
  );
}

function KpiCard({ label, value, tone = 'default' }: { label: string; value: string | number; tone?: 'default' | 'amber' }) {
  const toneClasses = tone === 'amber'
    ? 'border-amber-200 bg-amber-50 text-amber-900'
    : 'border-gray-200 bg-gray-50 text-gray-900';
  return (
    <div className={`rounded-2xl border p-4 ${toneClasses}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}
