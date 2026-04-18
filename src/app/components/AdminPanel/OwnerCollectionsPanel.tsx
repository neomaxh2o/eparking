'use client';

import { useEffect, useMemo, useState } from 'react';

type BillingDoc = {
  _id: string;
  invoiceCode?: string;
  estado?: string;
  monto?: number;
  assignedParking?: string | null;
  paymentMethod?: string;
  paymentReference?: string;
  sourceType?: string;
  fechaPago?: string | null;
  abonadoNombre?: string;
  abonadoEmail?: string;
};

export default function OwnerCollectionsPanel({ selectedParkingId }: { selectedParkingId?: string }) {
  const [docs, setDocs] = useState<BillingDoc[]>([]);
  const [paymentReference, setPaymentReference] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDocs = async () => {
    const res = await fetch('/api/v2/billing/documents', { cache: 'no-store' });
    const data = await res.json().catch(() => []);
    const items = Array.isArray(data) ? data : [];
    setDocs(selectedParkingId ? items.filter((d) => String(d.assignedParking || '') === String(selectedParkingId)) : items);
  };

  useEffect(() => { void fetchDocs(); }, [selectedParkingId]);

  const pending = useMemo(() => docs.filter((d) => ['emitida', 'pendiente', 'vencida'].includes(String(d.estado || ''))), [docs]);
  const paid = useMemo(() => docs.filter((d) => d.estado === 'pagada').slice(0, 10), [docs]);

  const reconcile = async () => {
    try {
      setMessage(null);
      setError(null);
      if (!paymentReference.trim()) {
        setError('Ingresá una referencia de pago.');
        return;
      }
      const res = await fetch('/api/v2/abonados/payments/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentReference: paymentReference.trim(), paymentProvider: 'electronic', paymentMethod: 'electronic' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo conciliar el pago');
      setMessage(`Conciliación correcta. Facturas actualizadas: ${data.invoicesUpdated ?? 0}`);
      await fetchDocs();
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    }
  };

  const accredit = async (invoiceId: string) => {
    try {
      setMessage(null);
      setError(null);
      const res = await fetch(`/api/v2/billing/documents/${invoiceId}/acreditar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentProvider: 'manual', paymentMethod: 'admin-cash' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo acreditar el documento');
      setMessage('Cobro acreditado correctamente.');
      await fetchDocs();
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Cobranzas</h2>
        <p className="mt-1 text-sm text-gray-500">Bloque principal de operación para seguimiento y acreditación de cobros.</p>
      </div>
      {message ? <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">{message}</div> : null}
      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
        <h3 className="text-lg font-bold text-gray-900">Conciliación manual por referencia</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
          <input value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder="Referencia de pago" className="rounded-xl border border-gray-300 px-4 py-3" />
          <button onClick={() => void reconcile()} className="rounded-xl border border-gray-300 bg-gray-200 px-5 py-3 font-semibold text-gray-800 hover:bg-gray-300">Conciliar</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
          <h3 className="text-lg font-bold text-gray-900">Facturas pendientes / vencidas</h3>
          {!pending.length ? <p className="text-sm text-gray-500">No hay facturas pendientes para el filtro actual.</p> : pending.slice(0, 15).map((doc) => (
            <div key={doc._id} className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p><strong>Código:</strong> {doc.invoiceCode || '-'}</p>
                  <p><strong>Estado:</strong> {doc.estado || '-'}</p>
                  <p><strong>Monto:</strong> ${Number(doc.monto || 0).toFixed(2)}</p>
                  <p><strong>Referencia:</strong> {doc.paymentReference || '-'}</p>
                </div>
                <button onClick={() => void accredit(doc._id)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                  Acreditar cobro
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
          <h3 className="text-lg font-bold text-gray-900">Últimas cobranzas</h3>
          {!paid.length ? <p className="text-sm text-gray-500">No hay cobranzas registradas para el filtro actual.</p> : paid.map((doc) => (
            <div key={doc._id} className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
              <p><strong>Código:</strong> {doc.invoiceCode || '-'}</p>
              <p><strong>Monto:</strong> ${Number(doc.monto || 0).toFixed(2)}</p>
              <p><strong>Método:</strong> {doc.paymentMethod || '-'}</p>
              <p><strong>Referencia:</strong> {doc.paymentReference || '-'}</p>
              <p><strong>Fecha pago:</strong> {doc.fechaPago ? new Date(doc.fechaPago).toLocaleString() : '-'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
