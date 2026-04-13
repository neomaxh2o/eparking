'use client';

function badgeClass(kind: 'neutral' | 'success' | 'warning' | 'danger') {
  if (kind === 'success') return 'bg-green-100 text-green-800 border-green-200';
  if (kind === 'warning') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  if (kind === 'danger') return 'bg-red-100 text-red-800 border-red-200';
  return 'bg-gray-100 text-gray-800 border-gray-200';
}

function financialBadgeKind(status?: 'al_dia' | 'con_deuda' | 'moroso') {
  if (status === 'al_dia') return 'success';
  if (status === 'con_deuda') return 'warning';
  if (status === 'moroso') return 'danger';
  return 'neutral';
}

function abonadoBadgeKind(status?: string) {
  if (!status) return 'neutral';
  const normalized = status.toLowerCase();
  if (normalized === 'activo') return 'success';
  if (normalized === 'suspendido' || normalized === 'pendiente') return 'warning';
  if (normalized === 'vencido' || normalized === 'inactivo' || normalized === 'moroso') return 'danger';
  return 'neutral';
}

type ClientProfile = {
  assignedParking?: { _id: string; name: string } | null;
} | null;

type ClientAbonado = {
  estado?: string;
  financialStatus?: 'al_dia' | 'con_deuda' | 'moroso';
  hasDebt?: boolean;
  hasOverdueDebt?: boolean;
  fechaAlta?: string | null;
  fechaVencimiento?: string | null;
  tarifaNombre?: string;
  importeBase?: number;
  billingMode?: string;
} | null;

type ClientInvoice = {
  id: string;
  estado: string;
  monto: number;
  moneda: string;
  periodoLabel: string;
  fechaVencimiento?: string | null;
}[];

function formatDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
}

export default function AccountStatus({ profile, abonado, invoices }: { profile: ClientProfile; abonado: ClientAbonado; invoices: ClientInvoice }) {
  const pending = invoices.filter((invoice) => ['pendiente', 'emitida', 'vencida'].includes(invoice.estado));
  const totalDebt = pending.reduce((acc, invoice) => acc + Number(invoice.monto ?? 0), 0);

  if (!abonado) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Estado de Cuenta</h2>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
          No tenés un abono asociado a tu usuario todavía. Podés ver tu perfil, pero no hay plan, deuda ni vencimiento activos.
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded bg-gray-50"><strong>Parking asignado:</strong> {profile?.assignedParking?.name || '-'}</div>
          <div className="p-4 border rounded bg-gray-50"><strong>Facturas emitidas:</strong> {invoices.length}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800 mb-2">Estado de Cuenta</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded bg-gray-50"><strong>Parking asignado:</strong> {profile?.assignedParking?.name || abonado?.assignedParking?.name || '-'}</div>
        <div className="p-4 border rounded bg-gray-50">
          <strong>Estado abonado:</strong>{' '}
          <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${badgeClass(abonadoBadgeKind(abonado?.estado) as any)}`}>
            {abonado?.estado || '-'}
          </span>
        </div>
        <div className="p-4 border rounded bg-gray-50">
          <strong>Estado financiero:</strong>{' '}
          <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${badgeClass(financialBadgeKind(abonado?.financialStatus) as any)}`}>
            {abonado?.financialStatus || '-'}
          </span>
        </div>
        <div className="p-4 border rounded bg-gray-50"><strong>Plan:</strong> {abonado?.tarifaNombre || '-'}</div>
        <div className="p-4 border rounded bg-gray-50"><strong>Facturación:</strong> {abonado?.billingMode || '-'}</div>
        <div className="p-4 border rounded bg-gray-50"><strong>Importe base:</strong> ${Number(abonado?.importeBase ?? 0).toFixed(2)}</div>
        <div className="p-4 border rounded bg-gray-50"><strong>Fecha alta:</strong> {formatDate(abonado?.fechaAlta)}</div>
        <div className="p-4 border rounded bg-gray-50"><strong>Vencimiento:</strong> {formatDate(abonado?.fechaVencimiento)}</div>
        <div className="p-4 border rounded bg-gray-50"><strong>Facturas con deuda:</strong> {pending.length}</div>
        <div className="p-4 border rounded bg-gray-50"><strong>Deuda total:</strong> ${totalDebt.toFixed(2)}</div>
      </div>
    </div>
  );
}
