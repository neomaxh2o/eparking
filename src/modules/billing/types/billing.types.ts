export type BillingSource = 'abonado' | 'ticket' | 'caja' | 'admin' | 'operator' | 'automatic';

export type BillingActorRole = 'admin' | 'owner' | 'operator' | 'system';

export type VoucherType =
  | 'factura_a'
  | 'factura_b'
  | 'factura_c'
  | 'consumidor_final'
  | 'nota_credito'
  | 'nota_debito';

export type BillingDocumentStatus = 'pendiente' | 'emitida' | 'pagada' | 'vencida' | 'cancelada';

export type BillingFrequency = 'mensual' | 'diaria' | 'hora';

export type CustomerTaxCondition =
  | 'responsable_inscripto'
  | 'monotributo'
  | 'exento'
  | 'consumidor_final'
  | 'no_categorizado';

export type CustomerDocumentType = 'dni' | 'cuit' | 'otro';

export interface EmitAbonadoInvoiceInput {
  abonadoId: string;
  actorRole: BillingActorRole;
  actorUserId: string;
  source: BillingSource;
  turnoId?: string | null;
  cajaNumero?: number | null;
  operatorId?: string | null;
  tipoFacturacion?: BillingFrequency;
  monto?: number;
  moneda?: string;
  periodoLabel?: string;
  fechaVencimiento?: string | Date | null;
  estado?: BillingDocumentStatus;
  paymentReference?: string;
  voucherType?: VoucherType;
  customerTaxCondition?: CustomerTaxCondition;
  customerDocumentType?: CustomerDocumentType;
  customerDocumentNumber?: string;
  customerBusinessName?: string;
  pointOfSale?: string;
}

export interface BillingDocument {
  _id: string;
  sourceType: 'abonado' | 'ticket' | 'otro';
  displayLabel: string;
  abonadoNombre: string;
  abonadoEmail: string;
  tarifaNombre: string;
  ticketNumber: string;
  ticketPatente: string;
  ticketCategoria: string;
  ticketTipoEstadia: string;
  parkingName: string;
  parkingPointOfSale: string;
  parkingBusinessName: string;
  fiscalSource: string;
  fiscalStatus: string;
  invoiceCode: string;
  paymentReference: string;
  tipoFacturacion: string;
  voucherType: string;
  periodoLabel: string;
  monto: number;
  estado: BillingDocumentStatus;
  paymentProvider: string;
  paymentMethod: string;
  fechaEmision?: string | Date | null;
  fechaVencimiento?: string | Date | null;
  fechaPago?: string | Date | null;
  [key: string]: unknown;
}
