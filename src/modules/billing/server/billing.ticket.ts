import AbonadoInvoice from '@/models/AbonadoInvoice';
import ParkingLot from '@/models/ParkingLot';
import Turno from '@/models/Turno';
import User from '@/models/User';
import type { BillingActorRole, VoucherType, CustomerTaxCondition, CustomerDocumentType } from '@/modules/billing/types/billing.types';
import { resolveCustomerTaxCondition, resolveVoucherType, validateVoucherPolicy } from '@/modules/billing/server/billing.policy';

interface EmitTicketBillingDocumentInput {
  actorRole: BillingActorRole;
  actorUserId: string;
  ticketId: string;
  ticketNumber: string;
  parkinglotId?: string | null;
  ownerId?: string | null;
  turnoId?: string | null;
  cajaNumero?: number | null;
  amount: number;
  paymentMethod?: string | null;
  voucherType?: VoucherType;
  customerTaxCondition?: CustomerTaxCondition;
  customerDocumentType?: CustomerDocumentType;
  customerDocumentNumber?: string;
  customerBusinessName?: string;
  pointOfSale?: string;
  patente?: string;
  categoria?: string;
  tipoEstadia?: string;
}

export async function emitTicketBillingDocument(input: EmitTicketBillingDocumentInput) {
  const existing = await AbonadoInvoice.findOne({
    sourceType: 'ticket',
    sourceId: input.ticketId,
  });

  if (existing) {
    return existing;
  }

  const operator = input.actorUserId ? await User.findById(input.actorUserId).lean() : null;
  const turno = input.turnoId ? await Turno.findById(input.turnoId).lean() : null;

  const resolvedParkinglotId = input.parkinglotId ?? ((operator as any)?.assignedParking ? String((operator as any).assignedParking) : null);
  const parking = resolvedParkinglotId ? await ParkingLot.findById(resolvedParkinglotId).lean() : null;
  const resolvedOwnerId = input.ownerId ?? ((parking as any)?.owner ? String((parking as any).owner) : null);
  const turnoCajaNumero = Number((turno as any)?.cajaNumero ?? (turno as any)?.numeroCaja ?? 0);
  const resolvedCajaNumero = input.cajaNumero ?? (turnoCajaNumero > 0 ? turnoCajaNumero : null);

  const parkingBillingProfile = (parking as any)?.billingProfile ?? null;
  const hasActiveParkingBillingProfile = Boolean(
    parkingBillingProfile?.enabled &&
    String(parkingBillingProfile?.businessName ?? '').trim() &&
    String(parkingBillingProfile?.documentNumber ?? '').trim() &&
    String(parkingBillingProfile?.pointOfSale ?? '').trim(),
  );
  const fiscalSource = hasActiveParkingBillingProfile ? 'parking' : ((operator as any)?.puntoDeVenta ? 'user' : 'fallback');
  const fiscalStatus = hasActiveParkingBillingProfile ? 'valid' : ((operator as any)?.puntoDeVenta ? 'fallback' : 'invalid');

  const customerTaxCondition = input.customerTaxCondition ?? resolveCustomerTaxCondition(parkingBillingProfile?.taxCondition ?? null);
  const voucherType = resolveVoucherType({
    requested: input.voucherType ?? parkingBillingProfile?.voucherTypeDefault,
    taxCondition: customerTaxCondition,
  });
  const customerDocumentType = input.customerDocumentType ?? parkingBillingProfile?.documentType ?? 'dni';
  const customerDocumentNumber = input.customerDocumentNumber ?? parkingBillingProfile?.documentNumber ?? '';
  const customerBusinessName = input.customerBusinessName ?? parkingBillingProfile?.businessName ?? 'Consumidor Final';
  const pointOfSale = input.pointOfSale ?? parkingBillingProfile?.pointOfSale ?? String((operator as any)?.puntoDeVenta ?? '');

  validateVoucherPolicy({
    actorRole: input.actorRole,
    voucherType,
    customerTaxCondition,
    customerDocumentNumber,
    customerBusinessName,
  });

  const now = new Date();
  const invoiceCode = `TCK:${input.ticketNumber}:${Date.now()}`;

  const invoice = await AbonadoInvoice.create({
    abonadoId: null,
    clientId: null,
    ownerId: resolvedOwnerId ?? null,
    assignedParking: resolvedParkinglotId ?? null,
    tarifaId: '',
    invoiceCode,
    voucherType,
    customerTaxCondition,
    customerDocumentType,
    customerDocumentNumber,
    customerBusinessName,
    pointOfSale,
    sourceType: 'ticket',
    sourceId: input.ticketId,
    paymentReference: invoiceCode,
    tipoFacturacion: 'hora',
    periodoLabel: now.toISOString().slice(0, 10),
    fechaEmision: now,
    fechaVencimiento: null,
    estado: 'emitida',
    monto: Number(input.amount ?? 0),
    moneda: 'ARS',
    snapshot: {
      source: 'ticket-caja',
      ticket: {
        ticketId: input.ticketId,
        ticketNumber: input.ticketNumber,
        patente: input.patente ?? '',
        categoria: input.categoria ?? '',
        tipoEstadia: input.tipoEstadia ?? '',
      },
      operator: operator
        ? {
            id: String((operator as any)._id),
            role: (operator as any).role ?? '',
            pointOfSale: (operator as any).puntoDeVenta ?? '',
          }
        : null,
      fiscal: {
        source: fiscalSource,
        status: fiscalStatus,
        pointOfSale,
        businessName: customerBusinessName,
      },
      parking: parking
        ? {
            id: String((parking as any)._id),
            name: (parking as any).name ?? '',
            ownerId: resolvedOwnerId ?? null,
            billingProfile: parkingBillingProfile
              ? {
                  enabled: Boolean(parkingBillingProfile?.enabled ?? false),
                  businessName: parkingBillingProfile?.businessName ?? '',
                  taxCondition: parkingBillingProfile?.taxCondition ?? '',
                  documentType: parkingBillingProfile?.documentType ?? '',
                  documentNumber: parkingBillingProfile?.documentNumber ?? '',
                  pointOfSale: parkingBillingProfile?.pointOfSale ?? '',
                  voucherTypeDefault: parkingBillingProfile?.voucherTypeDefault ?? '',
                }
              : null,
          }
        : null,
      turno: turno
        ? {
            id: String((turno as any)._id),
            cajaNumero: resolvedCajaNumero,
            numeroTurno: (turno as any).numeroTurno ?? null,
            codigoTurno: (turno as any).codigoTurno ?? '',
          }
        : null,
    },
    origen: input.actorRole === 'operator' ? 'operator' : 'admin',
    turnoId: input.turnoId ?? null,
    cajaNumero: resolvedCajaNumero,
    operatorId: input.actorRole === 'operator' ? input.actorUserId : null,
    paymentMethod: input.paymentMethod ?? '',
  });

  return invoice;
}
