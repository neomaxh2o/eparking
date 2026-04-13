import Abonado from '@/models/Abonado';
import AbonadoInvoice from '@/models/AbonadoInvoice';

export async function runBillingFinancialStatusJob(input: { ownerId?: string | null } = {}) {
  const now = new Date();

  const invoiceQuery: Record<string, unknown> = {
    estado: { $in: ['emitida', 'pendiente'] },
    fechaVencimiento: { $ne: null, $lt: now },
  };

  const abonadoQuery: Record<string, unknown> = {};
  if (input.ownerId) {
    invoiceQuery.ownerId = input.ownerId;
    abonadoQuery.ownerId = input.ownerId;
  }

  const overdueInvoices = await AbonadoInvoice.find(invoiceQuery);
  let invoicesMarkedOverdue = 0;
  for (const invoice of overdueInvoices) {
    if (invoice.estado !== 'vencida') {
      invoice.estado = 'vencida';
      await invoice.save();
      invoicesMarkedOverdue += 1;
    }
  }

  const abonados = await Abonado.find(abonadoQuery);
  let abonadosSuspended = 0;

  for (const abonado of abonados) {
    const overdue = await AbonadoInvoice.exists({
      abonadoId: abonado._id,
      estado: 'vencida',
      ...(input.ownerId ? { ownerId: input.ownerId } : {}),
    });

    if (overdue && abonado.estado !== 'suspendido') {
      abonado.estado = 'suspendido';
      await abonado.save();
      abonadosSuspended += 1;
    }
  }

  return {
    ok: true,
    timestamp: now.toISOString(),
    invoicesChecked: overdueInvoices.length,
    invoicesMarkedOverdue,
    abonadosChecked: abonados.length,
    abonadosSuspended,
  };
}
