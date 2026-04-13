'use client';

function invoiceBadgeClass(status?: string) {
  const normalized = (status || '').toLowerCase();
  if (normalized === 'pagada' || normalized === 'acreditada') return 'bg-green-100 text-green-800 border-green-200';
  if (normalized === 'pendiente' || normalized === 'emitida') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  if (normalized === 'vencida' || normalized === 'rechazada') return 'bg-red-100 text-red-800 border-red-200';
  return 'bg-gray-100 text-gray-800 border-gray-200';
}

type ClientInvoice = {
  id: string;
  invoiceCode: string;
  estado: string;
  monto: number;
  moneda: string;
  tipoFacturacion: string;
  periodoLabel: string;
  fechaEmision?: string | null;
  fechaVencimiento?: string | null;
  fechaPago?: string | null;
  tarifaNombre: string;
  paymentProvider: string;
  paymentReference: string;
  paymentMethod: string;
  externalStatus: string;
};

function formatDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
}

export default function InvoicePayment({ invoices }: { invoices: ClientInvoice[] }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800 mb-2">Facturas</h2>
      {!invoices.length ? (
        <div className="p-4 border rounded bg-gray-50 text-gray-600">No hay facturas para mostrar. Si tu cuenta todavía no tiene abono o aún no se emitieron períodos, este panel permanecerá vacío.</div>
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="p-4 border rounded bg-gray-50 space-y-1">
              <div className="flex justify-between gap-4 flex-wrap">
                <span className="font-semibold">{invoice.invoiceCode || invoice.id}</span>
                <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${invoiceBadgeClass(invoice.estado)}`}>
                  {invoice.estado}
                </span>
              </div>
              <div className="text-sm text-gray-700">Periodo: {invoice.periodoLabel || '-'}</div>
              <div className="text-sm text-gray-700">Tarifa: {invoice.tarifaNombre || '-'}</div>
              <div className="text-sm text-gray-700">Tipo: {invoice.tipoFacturacion || '-'}</div>
              <div className="text-sm text-gray-700">Monto: {invoice.moneda} {Number(invoice.monto ?? 0).toFixed(2)}</div>
              <div className="text-sm text-gray-700">Emisión: {formatDate(invoice.fechaEmision)}</div>
              <div className="text-sm text-gray-700">Vencimiento: {formatDate(invoice.fechaVencimiento)}</div>
              <div className="text-sm text-gray-700">Pago: {formatDate(invoice.fechaPago)}</div>
              <div className="text-sm text-gray-700">Provider: {invoice.paymentProvider || '-'}</div>
              <div className="text-sm text-gray-700">Referencia: {invoice.paymentReference || '-'}</div>
              <div className="text-sm text-gray-700">Método: {invoice.paymentMethod || '-'}</div>
              <div className="text-sm text-gray-700">Estado externo: {invoice.externalStatus || '-'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
