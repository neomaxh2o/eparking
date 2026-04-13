'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

type ReportItem = {
  _id: string;
  turnoId: string;
  operatorName?: string;
  numeroCaja?: number;
  estado?: string;
  codigoTurno?: string;
  fechaApertura?: string;
  fechaCierreOperativo?: string;
  fechaLiquidacion?: string;
  fechaCierre?: string;
  createdAt?: string;
};

function formatDate(value?: string) {
  if (!value) return '-';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleString();
}

export default function PanelHistoricoCajas() {
  const { data: session } = useSession();
  const [items, setItems] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const role = session?.user?.role;
  const canAccess = role === 'owner' || role === 'admin';

  const fetchItems = useCallback(async () => {
    if (!canAccess) return;

    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/v2/turno-reportes?limit=100', { cache: 'no-store' });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Respuesta no válida del histórico (${res.status}). ${text.slice(0, 120)}`);
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo obtener el histórico');
      setItems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [canAccess]);

  const rebuildHistory = useCallback(async () => {
    try {
      setRebuilding(true);
      setError(null);
      setMessage(null);
      const res = await fetch('/api/v2/turno-reportes/backfill', { method: 'POST' });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Respuesta no válida al reconstruir histórico (${res.status}). ${text.slice(0, 120)}`);
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo reconstruir el histórico');
      setMessage(`Reconstrucción completada. Procesados: ${Number(data.processed ?? 0)}`);
      await fetchItems();
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    } finally {
      setRebuilding(false);
    }
  }, [fetchItems]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  if (!canAccess) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        No autorizado. Este módulo es solo para owner/admin.
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Histórico de cajas</h3>
          <p className="mt-1 text-sm text-gray-500">Cierres históricos guardados para consulta y descarga posterior.</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={() => void fetchItems()} disabled={loading || rebuilding} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60">
            Actualizar
          </button>
          <button type="button" onClick={() => void rebuildHistory()} disabled={loading || rebuilding} className="rounded-xl border border-gray-300 bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 disabled:opacity-60 hover:bg-gray-300">
            {rebuilding ? 'Reconstruyendo...' : 'Reconstruir histórico'}
          </button>
        </div>
      </div>

      {loading ? <p className="text-sm text-gray-500">Cargando histórico...</p> : null}
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!loading && !items.length ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">
          Todavía no hay reportes históricos guardados.
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {items.map((item) => (
              <div key={item._id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.codigoTurno || item.turnoId}</p>
                    <p className="mt-1 text-xs text-gray-500">Guardado: {formatDate(item.createdAt)}</p>
                  </div>
                  <span className="rounded-full border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-700">
                    Caja {item.numeroCaja ?? '-'}
                  </span>
                </div>

                <div className="mt-3 space-y-2 text-sm text-gray-600">
                  <p><strong>Operador:</strong> {item.operatorName || '-'}</p>
                  <p><strong>Estado:</strong> {item.estado || '-'}</p>
                  <p><strong>Apertura:</strong> {formatDate(item.fechaApertura)}</p>
                  <p><strong>Liquidación:</strong> {formatDate(item.fechaLiquidacion)}</p>
                  <p><strong>Cierre:</strong> {formatDate(item.fechaCierre)}</p>
                </div>

                <a href={`/api/v2/turno-reportes/${item._id}`} target="_blank" rel="noreferrer" className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                  Abrir / descargar
                </a>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm md:block">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-600">
                  <th className="px-3 py-2">Código</th>
                  <th className="px-3 py-2">Operador</th>
                  <th className="px-3 py-2">Caja</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Apertura</th>
                  <th className="px-3 py-2">Liquidación</th>
                  <th className="px-3 py-2">Cierre</th>
                  <th className="px-3 py-2">Guardado</th>
                  <th className="px-3 py-2">Acción</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id} className="border-b border-gray-100">
                    <td className="px-3 py-2 font-medium text-gray-900">{item.codigoTurno || item.turnoId}</td>
                    <td className="px-3 py-2">{item.operatorName || '-'}</td>
                    <td className="px-3 py-2">{item.numeroCaja ?? '-'}</td>
                    <td className="px-3 py-2">{item.estado || '-'}</td>
                    <td className="px-3 py-2">{formatDate(item.fechaApertura)}</td>
                    <td className="px-3 py-2">{formatDate(item.fechaLiquidacion)}</td>
                    <td className="px-3 py-2">{formatDate(item.fechaCierre)}</td>
                    <td className="px-3 py-2">{formatDate(item.createdAt)}</td>
                    <td className="px-3 py-2">
                      <a href={`/api/v2/turno-reportes/${item._id}`} target="_blank" rel="noreferrer" className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                        Abrir / descargar
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
