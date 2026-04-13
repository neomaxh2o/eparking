import AbonadoInvoice from '@/models/AbonadoInvoice';
import Abonado from '@/models/Abonado';

export async function getBillingDocumentById(query: Record<string, unknown>) {
  return AbonadoInvoice.findOne(query);
}

export async function updateBillingDocumentState(
  query: Record<string, unknown>,
  payload: {
    estado?: string;
    fechaVencimiento?: string | null;
    clearFechaPago?: boolean;
  },
) {
  const current = await AbonadoInvoice.findOne(query);
  if (!current) {
    return { error: 'DOCUMENT_NOT_FOUND' as const };
  }

  const sourceType = String((current as any).sourceType ?? 'abonado');
  if (sourceType === 'ticket' && payload?.estado === 'vencida') {
    return { error: 'INVALID_STATE_FOR_TICKET' as const };
  }

  const patch: Record<string, unknown> = {};
  if (payload?.estado) patch.estado = payload.estado;
  if (sourceType !== 'ticket' && payload?.fechaVencimiento !== undefined) {
    patch.fechaVencimiento = payload.fechaVencimiento || null;
  }
  if (payload?.estado === 'pagada') patch.fechaPago = new Date();
  if (payload?.estado !== 'pagada' && payload?.clearFechaPago) patch.fechaPago = null;

  const updated = await AbonadoInvoice.findOneAndUpdate({ _id: current._id }, patch, { new: true });
  return { document: updated };
}

export async function accreditBillingDocument(
  query: Record<string, unknown>,
  payload: {
    paymentProvider?: string;
    paymentReference?: string;
    paymentMethod?: string;
  },
) {
  const invoice = await AbonadoInvoice.findOne(query);
  if (!invoice) {
    return { error: 'DOCUMENT_NOT_FOUND' as const };
  }

  if (String((invoice as any).sourceType ?? 'abonado') !== 'abonado') {
    return { error: 'ACCREDIT_ONLY_ABONADO' as const };
  }

  invoice.estado = 'pagada';
  invoice.fechaPago = new Date();
  invoice.paymentProvider = payload?.paymentProvider ?? invoice.paymentProvider ?? 'electronic';
  invoice.paymentReference = payload?.paymentReference ?? invoice.paymentReference ?? '';
  invoice.paymentMethod = payload?.paymentMethod ?? invoice.paymentMethod ?? 'electronic';
  invoice.acreditadoAutomaticamente = true;
  await invoice.save();

  let abonado = null;
  if (invoice.abonadoId) {
    abonado = await Abonado.findById(invoice.abonadoId);
    if (abonado && (abonado.estado === 'suspendido' || abonado.estado === 'vencido')) {
      const remainingOverdue = await AbonadoInvoice.exists({
        abonadoId: abonado._id,
        estado: 'vencida',
        _id: { $ne: invoice._id },
        ...(query.ownerId ? { ownerId: query.ownerId } : {}),
      });

      if (!remainingOverdue) {
        abonado.estado = 'activo';
        await abonado.save();
      }
    }
  }

  return { document: invoice, abonado };
}
