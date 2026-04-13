'use client';

import { useState } from 'react';
import type { BillingDocument } from '@/modules/billing/types/billing.types';

function fiscalSourceLabel(source: string) {
  if (source === 'parking') return 'Fiscal playa';
  if (source === 'user') return 'Fallback user';
  return 'Sin perfil';
}

function fiscalSourceClass(source: string) {
  if (source === 'parking') return 'rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800';
  if (source === 'user') return 'rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800';
  return 'rounded-full bg-gray-200 px-2 py-1 text-xs font-semibold text-gray-700';
}

function fiscalStatusLabel(status: string) {
  if (status === 'valid') return 'Válido';
  if (status === 'fallback') return 'Fallback';
  return 'Inválido';
}

function fiscalStatusClass(status: string) {
  if (status === 'valid') return 'rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800';
  if (status === 'fallback') return 'rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800';
  return 'rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800';
}

function estadoClass(estado?: string) {
  if (estado === 'vencida') return 'text-red-700 font-semibold';
  if (estado === 'pagada') return 'text-emerald-700 font-semibold';
  if (estado === 'emitida' || estado === 'pendiente') return 'text-amber-700 font-semibold';
  return 'text-gray-700 font-semibold';
}

export default function BillingDocumentsList({
  billingDocumentsByPeriod,
  acreditarDocumento,
  marcarDocumento,
}: {
  billingDocumentsByPeriod: Record<string, BillingDocument[]>;
  acreditarDocumento: (documentId: string) => Promise<void> | void;
  marcarDocumento: (documentId: string, estado: 'pagada' | 'vencida' | 'cancelada') => Promise<void> | void;
}) {
  const [expandedDocumentId, setExpandedDocumentId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {Object.entries(billingDocumentsByPeriod).map(([periodo, items]) => (
        <div key={periodo} className="space-y-3">
          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
            <h4 className="text-sm font-bold uppercase tracking-wide text-gray-700">
              Período {periodo}
            </h4>
            <p className="mt-1 text-xs text-gray-500">
              {items.length} documento(s) · Total $
              {items.reduce((acc, f) => acc + Number(f.monto || 0), 0).toFixed(2)}
            </p>
          </div>

          {items.map((f) => {
            const sourceType = f.sourceType || 'abonado';
            const canAcreditar = sourceType === 'abonado' && f.estado !== 'pagada';
            const canMarkVencida = sourceType === 'abonado';
            const isExpanded = expandedDocumentId === f._id;

            return (
              <div key={f._id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-gray-200 px-2 py-1 text-xs font-semibold text-gray-700">
                        {sourceType === 'ticket' ? 'Ticket' : 'Abonado'}
                      </span>
                      <span className={fiscalSourceClass(f.fiscalSource)}>{fiscalSourceLabel(f.fiscalSource)}</span>
                      <span className={fiscalStatusClass(f.fiscalStatus)}>{fiscalStatusLabel(f.fiscalStatus)}</span>
                      <span className={estadoClass(f.estado)}>{f.estado || '-'}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Entidad</p>
                        <p className="mt-1 font-semibold text-gray-900">{f.displayLabel || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Código</p>
                        <p className="mt-1 break-all font-medium text-gray-900">{f.invoiceCode || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Monto</p>
                        <p className="mt-1 font-semibold text-gray-900">${Number(f.monto || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Emitida</p>
                        <p className="mt-1 text-gray-700">{f.fechaEmision ? new Date(f.fechaEmision).toLocaleString() : '-'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    <button
                      onClick={() => setExpandedDocumentId(isExpanded ? null : f._id)}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      {isExpanded ? 'Ocultar detalle' : 'Ver detalle'}
                    </button>
                    {canAcreditar ? (
                      <button
                        onClick={() => void acreditarDocumento(f._id)}
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                      >
                        Acreditar
                      </button>
                    ) : null}
                    <button
                      onClick={() => void marcarDocumento(f._id, 'pagada')}
                      className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                    >
                      Marcar pagada
                    </button>
                    {canMarkVencida ? (
                      <button
                        onClick={() => void marcarDocumento(f._id, 'vencida')}
                        className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100"
                      >
                        Marcar vencida
                      </button>
                    ) : null}
                    <button
                      onClick={() => void marcarDocumento(f._id, 'cancelada')}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>

                {isExpanded ? (
                  <div className="mt-4 grid grid-cols-1 gap-2 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-700 md:grid-cols-2">
                    <p><strong>Origen:</strong> {sourceType}</p>
                    <p><strong>Entidad:</strong> {f.displayLabel || '-'}</p>
                    {sourceType === 'ticket' ? (
                      <>
                        <p><strong>Patente:</strong> {f.ticketPatente || '-'}</p>
                        <p><strong>Categoría:</strong> {f.ticketCategoria || '-'}</p>
                        <p><strong>Tipo estadía:</strong> {f.ticketTipoEstadia || '-'}</p>
                      </>
                    ) : (
                      <>
                        <p><strong>Abonado:</strong> {f.abonadoNombre || '-'}</p>
                        <p><strong>Email:</strong> {f.abonadoEmail || '-'}</p>
                        <p><strong>Plan:</strong> {f.tarifaNombre || '-'}</p>
                      </>
                    )}
                    <p><strong>Referencia:</strong> {f.paymentReference || '-'}</p>
                    <p><strong>Tipo:</strong> {f.tipoFacturacion || '-'}</p>
                    <p><strong>Comprobante:</strong> {f.voucherType || '-'}</p>
                    <p><strong>Período:</strong> {f.periodoLabel || '-'}</p>
                    <p><strong>Playa emisora:</strong> {f.parkingName || '-'}</p>
                    <p><strong>Punto de venta:</strong> {f.parkingPointOfSale || '-'}</p>
                    <p><strong>Empresa emisora:</strong> {f.parkingBusinessName || '-'}</p>
                    <p><strong>Provider:</strong> {f.paymentProvider || '-'}</p>
                    <p><strong>Método:</strong> {f.paymentMethod || '-'}</p>
                    <p><strong>Emitida:</strong> {f.fechaEmision ? new Date(f.fechaEmision).toLocaleString() : '-'}</p>
                    <p><strong>Vence:</strong> {f.fechaVencimiento ? new Date(f.fechaVencimiento).toLocaleDateString() : '-'}</p>
                    <p><strong>Pago:</strong> {f.fechaPago ? new Date(f.fechaPago).toLocaleString() : '-'}</p>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
