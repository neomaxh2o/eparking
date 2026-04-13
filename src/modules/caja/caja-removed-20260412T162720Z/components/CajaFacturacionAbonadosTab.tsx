'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { TurnoCaja } from '@/modules/caja/types/caja.types';

type TipoFacturacionAbonado = 'mensual' | 'diaria' | 'hora';

type AbonadoCaja = {
  _id: string;
  nombre?: string;
  apellido?: string;
  email?: string;
  estado?: string;
  billingMode?: string;
  tarifaNombre?: string;
  importeBase?: number;
  fechaVencimiento?: string | null;
  assignedParking?: string | { _id?: string; name?: string } | null;
};

interface Props {
  operatorId: string;
  parkinglotId?: string;
  turno: TurnoCaja | null;
  loading?: boolean;
  onRefresh?: () => Promise<void> | void;
}

export default function CajaFacturacionAbonadosTab({ operatorId, parkinglotId, turno, loading = false, onRefresh }: Props) {
  const [abonados, setAbonados] = useState<AbonadoCaja[]>([]);
  const [abonadoSearch, setAbonadoSearch] = useState('');
  const [facturacionMessage, setFacturacionMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tipoFacturacionAbonado, setTipoFacturacionAbonado] = useState<TipoFacturacionAbonado>('mensual');
  const [montoFacturacionAbonado, setMontoFacturacionAbonado] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const refreshAbonados = useCallback(async () => {
    try {
      setError(null);
      const params = new URLSearchParams();
      params.set('estado', 'activo');
      params.set('billingMode', 'mensual');
      if (parkinglotId) params.set('assignedParking', parkinglotId);

      const res = await fetch(`/api/v2/abonados?${params.toString()}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo cargar abonados');
      setAbonados(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setAbonados([]);
      setError(err.message || 'No se pudo cargar abonados');
    }
  }, [parkinglotId]);

  useEffect(() => {
    void refreshAbonados();
  }, [refreshAbonados]);

  const handleFacturarAbonado = async (abonadoId: string) => {
    try {
      setSubmitting(true);
      setError(null);
      setFacturacionMessage(null);
      const res = await fetch('/api/v2/abonados/facturar-operador', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          abonadoId,
          operatorId,
          turnoId: turno?._id ?? null,
          cajaNumero: turno?.numeroCaja ?? null,
          tipoFacturacion: tipoFacturacionAbonado,
          monto: montoFacturacionAbonado ? Number(montoFacturacionAbonado) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo facturar el abonado');
      setFacturacionMessage('Factura de abonado emitida correctamente desde el tab de facturación.');
      if (onRefresh) await onRefresh();
      await refreshAbonados();
    } catch (err: any) {
      setError(err.message || 'Error facturando abonado');
    } finally {
      setSubmitting(false);
    }
  };

  const abonadosFiltrados = useMemo(() => {
    return abonados.filter((a) => {
      const text = `${a.nombre || ''} ${a.apellido || ''} ${a.email || ''} ${a.tarifaNombre || ''}`.toLowerCase();
      return !abonadoSearch || text.includes(abonadoSearch.toLowerCase());
    });
  }, [abonados, abonadoSearch]);

  return (
    <section className="dashboard-section p-5 md:p-6 space-y-4">
      <div>
        <h3 className="text-lg font-bold text-gray-900">Facturación</h3>
        <p className="mt-1 text-sm text-gray-500">Solo se muestran abonados activos de la playa asignada con abono mensual.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <input
          value={abonadoSearch}
          onChange={(e) => setAbonadoSearch(e.target.value)}
          placeholder="Buscar abonado por cliente, email o plan"
          className="rounded-xl border border-gray-300 px-4 py-3"
        />
        <select
          value={tipoFacturacionAbonado}
          onChange={(e) => setTipoFacturacionAbonado(e.target.value as TipoFacturacionAbonado)}
          className="rounded-xl border border-gray-300 bg-white px-4 py-3"
        >
          <option value="mensual">Mensual</option>
          <option value="diaria">Diaria</option>
          <option value="hora">Por hora</option>
        </select>
        <input
          type="number"
          min="0"
          step="0.01"
          value={montoFacturacionAbonado}
          onChange={(e) => setMontoFacturacionAbonado(e.target.value)}
          placeholder="Monto manual opcional"
          className="rounded-xl border border-gray-300 px-4 py-3"
        />
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          Turno: <strong>{turno?._id || '-'}</strong> · Caja: <strong>{turno?.numeroCaja ?? '-'}</strong>
        </div>
      </div>

      {facturacionMessage ? <p className="text-sm text-green-700">{facturacionMessage}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {!parkinglotId ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          No se pudo determinar la playa asignada del operador. No es posible filtrar abonados para facturación.
        </div>
      ) : !abonadosFiltrados.length ? (
        <p className="text-sm text-gray-500">No hay abonados activos con abono mensual para esta playa.</p>
      ) : (
        <div className="space-y-3">
          {abonadosFiltrados.map((a) => (
            <div key={a._id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <p><strong>Cliente:</strong> {(a.nombre || '') + ' ' + (a.apellido || '')}</p>
                  <p><strong>Plan:</strong> {a.tarifaNombre || '-'}</p>
                  <p><strong>Modo:</strong> {a.billingMode || '-'}</p>
                  <p><strong>Importe base:</strong> ${Number(a.importeBase || 0).toFixed(2)}</p>
                  <p><strong>Vencimiento:</strong> {a.fechaVencimiento ? new Date(a.fechaVencimiento).toLocaleDateString() : '-'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => void handleFacturarAbonado(a._id)}
                    disabled={loading || submitting}
                    className="rounded-lg border border-gray-300 bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Facturar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
