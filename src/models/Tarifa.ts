import mongoose, { Schema, model, models } from 'mongoose';

export interface ITarifaDoc {
  parkinglotId: mongoose.Types.ObjectId;
  category: 'Automóvil' | 'Camioneta' | 'Bicicleta' | 'Motocicleta' | 'Otros';
  tarifasHora?: ITarifaSub[];
  tarifasPorDia?: ITarifaSub[];
  tarifaMensual?: ITarifaSub[];
  tarifaLibre?: ITarifaSub[];
}

export interface ITarifaSub {
  cantidad?: number;
  precioUnitario: number;
  bonificacionPorc?: number;
  precioConDescuento?: number;
  precioTotal: number;
  tipoEstadia: 'hora' | 'dia' | 'mensual' | 'libre';
}

const TarifaHoraSchema = new Schema<ITarifaSub>({
  cantidad: { type: Number, required: true },
  precioUnitario: { type: Number, required: true },
  bonificacionPorc: { type: Number, default: 0 },
  precioConDescuento: Number,
  precioTotal: { type: Number, required: true },
  tipoEstadia: { type: String, enum: ['hora'], default: 'hora', required: true },
}, { _id: true });

const TarifaDiaSchema = new Schema<ITarifaSub>({
  cantidad: { type: Number, required: true },
  precioUnitario: { type: Number, required: true },
  bonificacionPorc: { type: Number, default: 0 },
  precioConDescuento: Number,
  precioTotal: { type: Number, required: true },
  tipoEstadia: { type: String, enum: ['dia'], default: 'dia', required: true },
}, { _id: true });

const TarifaMensualSchema = new Schema<ITarifaSub>({
  cantidad: { type: Number, required: true },
  precioUnitario: { type: Number, required: true },
  bonificacionPorc: { type: Number, default: 0 },
  precioConDescuento: Number,
  precioTotal: { type: Number, required: true },
  tipoEstadia: { type: String, enum: ['mensual'], default: 'mensual', required: true },
}, { _id: true });

const TarifaLibreSchema = new Schema<ITarifaSub>({
  precioUnitario: { type: Number, required: true },
  bonificacionPorc: { type: Number, default: 0 },
  precioConDescuento: Number,
  precioTotal: { type: Number, required: true },
  tipoEstadia: { type: String, enum: ['libre'], default: 'libre', required: true },
}, { _id: true });

const TarifaSchema = new Schema<ITarifaDoc>({
  parkinglotId: { type: Schema.Types.ObjectId, ref: 'ParkingLot', required: true },
  category: { type: String, enum: ['Automóvil','Camioneta','Bicicleta','Motocicleta','Otros'], required: true },
  tarifasHora: [TarifaHoraSchema],
  tarifasPorDia: [TarifaDiaSchema],
  tarifaMensual: [TarifaMensualSchema],
  tarifaLibre: [TarifaLibreSchema],
}, { timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' } });

// Índice único por parking y categoría
TarifaSchema.index({ parkinglotId: 1, category: 1 }, { unique: true });

export const Tarifa = models.Tarifa || model<ITarifaDoc>('Tarifa', TarifaSchema);
