import mongoose, { Schema, Document, Model } from 'mongoose';
import Plaza, { IPlaza, SubPlaza } from '@/models/Plaza/Plaza';

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

/**
 * Método estático para asignar automáticamente una subplaza disponible
 * Solo asigna plazas de categoría "mensual"
 */
SubscriptionSchema.statics.asignarPlazaDisponible = async function (
  subscriptionId: string
): Promise<ISubscription> {
  const categoria: 'mensual' = 'mensual';
  console.log(`[asignarPlazaDisponible] Buscando subplaza disponible para categoría: '${categoria}'`);

  // 1️⃣ Buscar la suscripción primero (necesitamos el userId y patente)
  const subscription = await this.findById(subscriptionId);
  if (!subscription) {
    console.error('[asignarPlazaDisponible] Suscripción no encontrada:', subscriptionId);
    throw new Error('Abonado no encontrado');
  }

  // 2️⃣ Buscar y ocupar una plaza
  const plaza = await Plaza.findOneAndUpdate(
    {
      categoria,
      plazasFisicas: { $elemMatch: { estado: 'disponible', ocupada: false } }
    },
    {
      $set: {
        'plazasFisicas.$.estado': 'ocupada',
        'plazasFisicas.$.ocupada': true,
        'plazasFisicas.$.usuarioAbonado': {
          ticketNumber: subscription._id.toString(), // usamos el id del abono como ticket
          patente: (subscription as any).patenteVehiculo || '' // si existe el campo patente
        }
      }
    },
    { new: true }
  );

  if (!plaza) {
    console.warn('[asignarPlazaDisponible] No hay plazas disponibles en categoría mensual');
    throw new Error('No hay plazas disponibles en categoría mensual');
  }

  console.log('[asignarPlazaDisponible] Plaza encontrada:', plaza._id);

  // 3️⃣ Buscar la subplaza ocupada
  const subPlazaOcupada = plaza.plazasFisicas.find(
    (sp: SubPlaza) => sp.estado === 'ocupada' && sp.ocupada && sp.usuarioAbonado?.ticketNumber === subscription._id.toString()
  );

  if (!subPlazaOcupada) {
    console.error('[asignarPlazaDisponible] No se encontró subplaza ocupada después del update');
    throw new Error('Error al asignar subplaza');
  }

  console.log(`[asignarPlazaDisponible] Subplaza ocupada encontrada: numero=${subPlazaOcupada.numero}`);

  // 4️⃣ Guardar la asignación en la suscripción
  subscription.assignedSubPlaza = {
    plazaId: plaza._id,
    subPlazaNumero: subPlazaOcupada.numero
  };
  await subscription.save();

  console.log(`[asignarPlazaDisponible] Subplaza asignada correctamente -> plazaId=${plaza._id}, subPlazaNumero=${subPlazaOcupada.numero}`);

  return subscription;
};





const Subscription =
  mongoose.models.Subscription ||
  mongoose.model<ISubscription, ISubscriptionModel>('Subscription', SubscriptionSchema);

export default Subscription;
