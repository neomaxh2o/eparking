import Abonado from '@/models/Abonado';
import AbonadoInvoice from '@/models/AbonadoInvoice';
import ParkingLot from '@/models/ParkingLot';
import User from '@/models/User';
import type { EmitAbonadoInvoiceInput, BillingFrequency } from '@/modules/billing/types/billing.types';
import { resolveCustomerTaxCondition, resolveVoucherType, validateVoucherPolicy } from '@/modules/billing/server/billing.policy';

export function resolveMontoDesdeSnapshot(tipoFacturacion: BillingFrequency, snapshot: any) {
  if (!snapshot || typeof snapshot !== 'object') return 0;

  if (tipoFacturacion === 'mensual') {
    return Number(snapshot?.precioTotal ?? snapshot?.precioConDescuento ?? snapshot?.precioUnitario ?? 0);
  }

  if (tipoFacturacion === 'diaria') {
    const dias = Array.isArray(snapshot?.tarifasPorDia) ? snapshot.tarifasPorDia : [];
    const day = dias.find((item: any) => Number(item?.cantidad) === 1) ?? dias[0];
    return Number(day?.precioTotal ?? day?.precioConDescuento ?? day?.precioUnitario ?? 0);
  }

  const horas = Array.isArray(snapshot?.tarifasHora) ? snapshot.tarifasHora : [];
  const hour = horas.find((item: any) => Number(item?.cantidad) === 1) ?? horas[0];
  return Number(hour?.precioTotal ?? hour?.precioConDescuento ?? hour?.precioUnitario ?? 0);
}

export async function emitAbonadoInvoice(input: EmitAbonadoInvoiceInput) {
  const abonado = await Abonado.findById(input.abonadoId);
  if (!abonado) {
    throw new Error('Abonado no encontrado');
  }

  const client = await User.findById(abonado.clientId).lean();
  const parking = abonado.assignedParking ? await ParkingLot.findById(abonado.assignedParking).lean() : null;
  const parkingBillingProfile = (parking as any)?.billingProfile ?? null;
  const hasActiveParkingBillingProfile = Boolean(
    parkingBillingProfile?.enabled &&
    String(parkingBillingProfile?.businessName ?? '').trim() &&
    String(parkingBillingProfile?.documentNumber ?? '').trim() &&
    String(parkingBillingProfile?.pointOfSale ?? '').trim(),
  );

  const tipoFacturacion = input.tipoFacturacion ?? abonado.billingMode ?? 'mensual';
  const montoCalculado = resolveMontoDesdeSnapshot(tipoFacturacion, abonado.tarifaSnapshot);
  const monto = Number(input.monto ?? montoCalculado ?? abonado.importeBase ?? 0);

  const fiscalSource = hasActiveParkingBillingProfile
    ? 'parking'
    : ((client as any)?.puntoDeVenta ? 'user' : 'fallback');
  const fiscalStatus = hasActiveParkingBillingProfile
    ? 'valid'
    : ((client as any)?.puntoDeVenta ? 'fallback' : 'invalid');

  const customerTaxCondition = input.customerTaxCondition ?? resolveCustomerTaxCondition((client as any)?.condicionFiscal ?? parkingBillingProfile?.taxCondition ?? null);
  const voucherType = resolveVoucherType({ requested: input.voucherType ?? parkingBillingProfile?.voucherTypeDefault, taxCondition: customerTaxCondition });
  const customerDocumentType = input.customerDocumentType ?? ((client as any)?.tipoDocumentoFiscal ?? parkingBillingProfile?.documentType ?? (((client as any)?.numeroDocumentoFiscal || (client as any)?.cuit) ? 'cuit' : 'dni'));
  const customerDocumentNumber = input.customerDocumentNumber ?? String((client as any)?.numeroDocumentoFiscal ?? (client as any)?.cuit ?? parkingBillingProfile?.documentNumber ?? (client as any)?.dni ?? '');
  const customerBusinessName = input.customerBusinessName ?? String((client as any)?.razonSocial ?? parkingBillingProfile?.businessName ?? `${abonado.nombre ?? ''} ${abonado.apellido ?? ''}`.trim());

  validateVoucherPolicy({
    actorRole: input.actorRole,
    voucherType,
    customerTaxCondition,
    customerDocumentNumber,
    customerBusinessName,
  });

  if (!monto || monto <= 0) {
    throw new Error(`No existe subtarifa válida para facturación ${tipoFacturacion}.`);
  }

  const now = new Date();
  const invoiceCode = `ABO:${String(abonado._id)}:${input.periodoLabel ?? `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`}:${Date.now()}`;

  const invoice = await AbonadoInvoice.create({
    abonadoId: abonado._id,
    clientId: abonado.clientId,
    ownerId: abonado.ownerId ?? null,
    assignedParking: abonado.assignedParking ?? null,
    tarifaId: abonado.tarifaId ?? '',
    invoiceCode,
    voucherType,
    customerTaxCondition,
    customerDocumentType,
    customerDocumentNumber,
    customerBusinessName,
    pointOfSale: input.pointOfSale ?? String((client as any)?.puntoDeVenta ?? parkingBillingProfile?.pointOfSale ?? ''),
    sourceType: 'abonado',
    sourceId: String(abonado._id),
    paymentReference: input.paymentReference ?? invoiceCode,
    tipoFacturacion,
    periodoLabel: input.periodoLabel ?? `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`,
    fechaEmision: now,
    fechaVencimiento: input.fechaVencimiento ?? abonado.fechaVencimiento ?? null,
    estado: input.estado ?? 'emitida',
    monto,
    moneda: input.moneda ?? 'ARS',
    snapshot: {
      abonado: {
        nombre: abonado.nombre,
        apellido: abonado.apellido,
        email: abonado.email,
      },
      tarifaNombre: abonado.tarifaNombre ?? '',
      tarifaSnapshot: abonado.tarifaSnapshot ?? {},
      source: input.source,
      fiscal: {
        source: fiscalSource,
        status: fiscalStatus,
        pointOfSale: input.pointOfSale ?? String((client as any)?.puntoDeVenta ?? parkingBillingProfile?.pointOfSale ?? ''),
        businessName: customerBusinessName,
      },
      parking: parking
        ? {
            id: String((parking as any)._id),
            name: (parking as any).name ?? '',
            ownerId: (parking as any).owner ? String((parking as any).owner) : null,
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
    },
    origen: input.actorRole === 'operator' ? 'operator' : 'admin',
    turnoId: input.turnoId ?? null,
    cajaNumero: input.cajaNumero ?? null,
    operatorId: input.operatorId ?? (input.actorRole === 'operator' ? input.actorUserId : null),
  });

  return invoice;
}
