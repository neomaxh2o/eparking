import AbonadoInvoice from '@/models/AbonadoInvoice';
import BillingClosure from '@/models/BillingClosure';
import type { CloseZetaInput } from '@/modules/billing/types/closure.types';

function normalizeDate(value?: string | Date | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function closeBillingZeta(input: CloseZetaInput) {
  const from = normalizeDate(input.from);
  const to = normalizeDate(input.to) ?? new Date();

  const query: Record<string, unknown> = { billingClosureId: null };
  if (input.ownerId) query.ownerId = input.ownerId;
  if (input.parkinglotId) query.assignedParking = input.parkinglotId;
  if (input.cajaNumero != null) query.cajaNumero = input.cajaNumero;
  if (from || to) {
    query.fechaEmision = {};
    if (from) (query.fechaEmision as Record<string, unknown>).$gte = from;
    if (to) (query.fechaEmision as Record<string, unknown>).$lte = to;
  }

  const documents = await AbonadoInvoice.find(query).lean();

  const summary = {
    efectivo: 0,
    tarjeta: 0,
    qr: 0,
    otros: 0,
    total: 0,
    documentsCount: documents.length,
    documentsByType: {} as Record<string, number>,
  };

  for (const doc of documents as any[]) {
    const amount = Number(doc.monto ?? 0);
    const method = String(doc.paymentMethod || 'otros');
    if (method === 'efectivo') summary.efectivo += amount;
    else if (method === 'tarjeta') summary.tarjeta += amount;
    else if (method === 'qr') summary.qr += amount;
    else summary.otros += amount;
    summary.total += amount;

    const key = String(doc.voucherType || doc.tipoFacturacion || 'sin_tipo');
    summary.documentsByType[key] = (summary.documentsByType[key] ?? 0) + 1;
  }

  const closure = await BillingClosure.create({
    type: 'zeta',
    status: 'closed',
    actorRole: input.actorRole,
    actorUserId: input.actorUserId ?? null,
    ownerId: input.ownerId ?? null,
    assignedParking: input.parkinglotId ?? null,
    cajaNumero: input.cajaNumero ?? null,
    from,
    to,
    totals: summary,
    linkedDocumentIds: documents.map((doc: any) => doc._id),
  });

  if (documents.length) {
    await AbonadoInvoice.updateMany(
      { _id: { $in: documents.map((doc: any) => doc._id) } },
      { $set: { billingClosureId: closure._id } }
    );
  }

  return closure;
}
