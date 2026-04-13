import AbonadoInvoice from '@/models/AbonadoInvoice';
import type { BillingDocument } from '@/modules/billing/types/billing.types';

export function normalizeBillingDocument(invoice: any): BillingDocument {
  const sourceType = invoice?.sourceType ?? 'abonado';
  const ticketSnapshot = invoice?.snapshot?.ticket ?? {};

  return {
    ...invoice,
    _id: String(invoice?._id ?? ''),
    sourceType,
    abonadoNombre: `${invoice?.snapshot?.abonado?.nombre ?? ''} ${invoice?.snapshot?.abonado?.apellido ?? ''}`.trim(),
    abonadoEmail: invoice?.snapshot?.abonado?.email ?? '',
    tarifaNombre: invoice?.snapshot?.tarifaNombre ?? '',
    ticketNumber: ticketSnapshot?.ticketNumber ?? '',
    ticketPatente: ticketSnapshot?.patente ?? '',
    ticketCategoria: ticketSnapshot?.categoria ?? '',
    ticketTipoEstadia: ticketSnapshot?.tipoEstadia ?? '',
    parkingName: invoice?.snapshot?.parking?.name ?? '',
    parkingPointOfSale: invoice?.snapshot?.fiscal?.pointOfSale ?? invoice?.snapshot?.parking?.billingProfile?.pointOfSale ?? invoice?.pointOfSale ?? '',
    parkingBusinessName: invoice?.snapshot?.fiscal?.businessName ?? invoice?.snapshot?.parking?.billingProfile?.businessName ?? '',
    fiscalSource: invoice?.snapshot?.fiscal?.source ?? 'fallback',
    fiscalStatus: invoice?.snapshot?.fiscal?.status ?? 'invalid',
    invoiceCode: invoice?.invoiceCode ?? '',
    paymentReference: invoice?.paymentReference ?? '',
    tipoFacturacion: invoice?.tipoFacturacion ?? '',
    voucherType: invoice?.voucherType ?? '',
    periodoLabel: invoice?.periodoLabel ?? '',
    monto: Number(invoice?.monto ?? 0),
    estado: invoice?.estado ?? 'pendiente',
    paymentProvider: invoice?.paymentProvider ?? '',
    paymentMethod: invoice?.paymentMethod ?? '',
    fechaEmision: invoice?.fechaEmision ?? null,
    fechaVencimiento: invoice?.fechaVencimiento ?? null,
    fechaPago: invoice?.fechaPago ?? null,
    displayLabel:
      sourceType === 'ticket'
        ? `Ticket ${ticketSnapshot?.ticketNumber ?? ''}`.trim()
        : `${invoice?.snapshot?.abonado?.nombre ?? ''} ${invoice?.snapshot?.abonado?.apellido ?? ''}`.trim(),
  };
}

export async function listBillingDocuments(query: Record<string, unknown>): Promise<BillingDocument[]> {
  const invoices = await AbonadoInvoice.find(query).sort({ createdAt: -1 }).lean();
  return invoices.map(normalizeBillingDocument);
}

export async function listAbonadoInvoices(query: Record<string, unknown>): Promise<BillingDocument[]> {
  return listBillingDocuments(query);
}
