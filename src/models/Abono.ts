import mongoose, { Schema, Document, Model } from 'mongoose';
import Plaza, { SubPlaza } from '@/models/Plaza/Plaza';

export type MedioAcceso = 'ticket' | 'tarjeta-rfid' | 'llavero-rfid';
export type TipoAbono = 'mensual' | 'dia';
export type TipoPago = 'efectivo' | 'tarjeta' | 'transferencia';

export interface ISubscription extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  assignedParking?: mongoose.Types.ObjectId;
  assignedSubPlaza?: { plazaId: mongoose.Types.ObjectId; subPlazaNumero: number };
  medioAcceso?: MedioAcceso;
  tipoAbono?: TipoAbono;
  fechaAlta?: Date;
  vigenciaHasta?: Date;
  tipoPago?: TipoPago;
  tipoTarifa?: string;
  idMedioAcceso?: string;
  periodoExtension?: number;
}

export type ISubscriptionModel = Model<ISubscription> & {
  asignarPlazaDisponible(subscriptionId: string): Promise<ISubscription>;
};

const SubscriptionSchema: Schema<ISubscription> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedParking: { type: Schema.Types.ObjectId, ref: 'ParkingLot' },
    assignedSubPlaza: {
      plazaId: { type: Schema.Types.ObjectId, ref: 'Plaza' },
      subPlazaNumero: { type: Number },
    },
    medioAcceso: { type: String, enum: ['ticket', 'tarjeta-rfid', 'llavero-rfid'] },
    tipoAbono: { type: String, enum: ['mensual', 'dia'] },
    fechaAlta: { type: Date },
    vigenciaHasta: { type: Date },
    tipoPago: { type: String, enum: ['efectivo', 'tarjeta', 'transferencia'] },
    tipoTarifa: { type: String },
    idMedioAcceso: { type: String },
    periodoExtension: { type: Number },
  },
  { timestamps: true }
);

SubscriptionSchema.statics.asignarPlazaDisponible = async function (subscriptionId: string) {
  const categoria: 'mensual' = 'mensual';
  const subscription = await this.findById(subscriptionId);
  if (!subscription) throw new Error('Abonado no encontrado');

  const plaza = await Plaza.findOneAndUpdate(
    { categoria, plazasFisicas: { $elemMatch: { estado: 'disponible', ocupada: false } } },
    {
      $set: {
        'plazasFisicas.$.estado': 'ocupada',
        'plazasFisicas.$.ocupada': true,
        'plazasFisicas.$.usuarioAbonado': {
          ticketNumber: subscription._id.toString(),
          patente: (subscription as any).patenteVehiculo || ''
        }
      }
    },
    { new: true }
  );

  if (!plaza) throw new Error('No hay plazas disponibles en categoría mensual');

  const subPlazaOcupada = plaza.plazasFisicas.find(
    sp => sp.estado === 'ocupada' && sp.ocupada && sp.usuarioAbonado?.ticketNumber === subscription._id.toString()
  );

  if (!subPlazaOcupada) throw new Error('Error al asignar subplaza');

  subscription.assignedSubPlaza = { plazaId: plaza._id, subPlazaNumero: subPlazaOcupada.numero };
  await subscription.save();

  return subscription;
};

const Subscription = mongoose.models.Subscription || mongoose.model<ISubscription, ISubscriptionModel>('Subscription', SubscriptionSchema);

export default Subscription;
