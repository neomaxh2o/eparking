import mongoose, { Schema, Document } from 'mongoose';

export interface IAbonadoInvoice extends Document {
  abonadoId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  ownerId?: mongoose.Types.ObjectId | null;
  assignedParking?: mongoose.Types.ObjectId | null;
  tarifaId?: string;
  tipoFacturacion: 'mensual' | 'diaria' | 'hora';
  periodoLabel?: string;
  fechaEmision: Date;
  fechaVencimiento?: Date | null;
  fechaPago?: Date | null;
  estado: 'pendiente' | 'emitida' | 'pagada' | 'vencida' | 'cancelada';
  monto: number;
  moneda?: string;
  snapshot?: Record<string, unknown>;
  origen?: 'admin' | 'operator';
  turnoId?: mongoose.Types.ObjectId | null;
  cajaNumero?: number | null;
  operatorId?: mongoose.Types.ObjectId | null;
  invoiceCode?: string;
  voucherType?: 'factura_a' | 'factura_b' | 'factura_c' | 'consumidor_final' | 'nota_credito' | 'nota_debito';
  customerTaxCondition?: 'responsable_inscripto' | 'monotributo' | 'exento' | 'consumidor_final' | 'no_categorizado';
  customerDocumentType?: 'dni' | 'cuit' | 'otro';
  customerDocumentNumber?: string;
  customerBusinessName?: string;
  pointOfSale?: string;
  sourceType?: 'abonado' | 'ticket' | 'otro';
  sourceId?: string;
  paymentProvider?: string;
  paymentReference?: string;
  paymentMethod?: string;
  acreditadoAutomaticamente?: boolean;
  externalStatus?: string;
  externalPayload?: Record<string, unknown>;
  billingClosureId?: mongoose.Types.ObjectId | null;
}

const AbonadoInvoiceSchema = new Schema<IAbonadoInvoice>(
  {
    abonadoId: { type: Schema.Types.ObjectId, ref: 'Abonado', required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    assignedParking: { type: Schema.Types.ObjectId, ref: 'ParkingLot', default: null, index: true },
    tarifaId: { type: String, default: '' },
    tipoFacturacion: { type: String, enum: ['mensual', 'diaria', 'hora'], default: 'mensual' },
    periodoLabel: { type: String, default: '' },
    fechaEmision: { type: Date, default: Date.now },
    fechaVencimiento: { type: Date, default: null },
    fechaPago: { type: Date, default: null },
    estado: { type: String, enum: ['pendiente', 'emitida', 'pagada', 'vencida', 'cancelada'], default: 'pendiente' },
    monto: { type: Number, required: true, default: 0 },
    moneda: { type: String, default: 'ARS' },
    snapshot: { type: Schema.Types.Mixed, default: {} },
    origen: { type: String, enum: ['admin', 'operator'], default: 'admin' },
    turnoId: { type: Schema.Types.ObjectId, ref: 'Turno', default: null },
    cajaNumero: { type: Number, default: null },
    operatorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    invoiceCode: { type: String, default: '', index: true },
    voucherType: { type: String, enum: ['factura_a', 'factura_b', 'factura_c', 'consumidor_final', 'nota_credito', 'nota_debito'], default: 'consumidor_final' },
    customerTaxCondition: { type: String, enum: ['responsable_inscripto', 'monotributo', 'exento', 'consumidor_final', 'no_categorizado'], default: 'consumidor_final' },
    customerDocumentType: { type: String, enum: ['dni', 'cuit', 'otro'], default: 'dni' },
    customerDocumentNumber: { type: String, default: '' },
    customerBusinessName: { type: String, default: '' },
    pointOfSale: { type: String, default: '' },
    sourceType: { type: String, enum: ['abonado', 'ticket', 'otro'], default: 'abonado' },
    sourceId: { type: String, default: '' },
    paymentProvider: { type: String, default: '' },
    paymentReference: { type: String, default: '' },
    paymentMethod: { type: String, default: '' },
    acreditadoAutomaticamente: { type: Boolean, default: false },
    externalStatus: { type: String, default: '' },
    externalPayload: { type: Schema.Types.Mixed, default: {} },
    billingClosureId: { type: Schema.Types.ObjectId, ref: 'BillingClosure', default: null, index: true },
  },
  { timestamps: true },
);

export default mongoose.models.AbonadoInvoice || mongoose.model<IAbonadoInvoice>('AbonadoInvoice', AbonadoInvoiceSchema);
