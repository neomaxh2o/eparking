import type { BillingActorRole, CustomerTaxCondition, VoucherType } from '@/modules/billing/types/billing.types';

export function resolveCustomerTaxCondition(raw?: string | null): CustomerTaxCondition {
  const normalized = (raw || '').toLowerCase();
  if (normalized.includes('responsable')) return 'responsable_inscripto';
  if (normalized.includes('monotrib')) return 'monotributo';
  if (normalized.includes('exento')) return 'exento';
  if (normalized.includes('consumidor')) return 'consumidor_final';
  return 'consumidor_final';
}

export function resolveVoucherType(input: { requested?: VoucherType; taxCondition?: CustomerTaxCondition }): VoucherType {
  if (input.requested) return input.requested;
  if (input.taxCondition === 'responsable_inscripto') return 'factura_a';
  if (input.taxCondition === 'monotributo' || input.taxCondition === 'exento') return 'factura_c';
  return 'consumidor_final';
}

export function validateVoucherPolicy(input: {
  actorRole: BillingActorRole;
  voucherType: VoucherType;
  customerTaxCondition: CustomerTaxCondition;
  customerDocumentNumber?: string;
  customerBusinessName?: string;
}) {
  const { actorRole, voucherType, customerTaxCondition, customerDocumentNumber, customerBusinessName } = input;

  const hasDocument = Boolean(customerDocumentNumber && String(customerDocumentNumber).trim());
  const hasBusinessName = Boolean(customerBusinessName && String(customerBusinessName).trim());

  if (voucherType === 'factura_a') {
    if (customerTaxCondition !== 'responsable_inscripto') {
      throw new Error('Factura A solo puede emitirse a responsable inscripto.');
    }
    if (!hasDocument || !hasBusinessName) {
      throw new Error('Factura A requiere documento fiscal y razón social.');
    }
    if (actorRole === 'operator') {
      throw new Error('Operator no puede emitir Factura A directamente.');
    }
  }

  if (voucherType === 'factura_b') {
    if (!hasDocument) {
      throw new Error('Factura B requiere documento del cliente.');
    }
  }

  if (voucherType === 'factura_c') {
    if ((customerTaxCondition === 'responsable_inscripto') && actorRole !== 'admin' && actorRole !== 'owner') {
      throw new Error('No corresponde Factura C para responsable inscripto en este contexto.');
    }
  }

  if (voucherType === 'consumidor_final') {
    return true;
  }

  return true;
}
