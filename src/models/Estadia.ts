import mongoose, { Schema, Document, models } from 'mongoose';

export type Categoria = 'Automóvil' | 'Motocicleta' | 'Camioneta' | 'Otros';
export type TipoEstadia = 'hora' | 'dia' | 'libre' | 'mensual';
export type EstadoEstadia = 'activa' | 'cerrada' | 'prepago';

export interface IEstadia extends Document {
  ticket: string;
  patente: string;
  categoria: Categoria;
  cliente?: {
    nombre?: string;
    apellido?: string;
    dni?: string;
    telefono?: string;
  };
  tarifaId: mongoose.Types.ObjectId;
  operadorId: mongoose.Types.ObjectId;
  parkinglotId: mongoose.Types.ObjectId;
  horaEntrada: Date;
  horaSalida?: Date;
  horaExpiracion?: Date;
  estado: EstadoEstadia;
  totalCobrado?: number;
  metodoPago?: 'efectivo' | 'tarjeta' | 'qr' | 'otros';
  tipoEstadia: TipoEstadia;
  cantidadHoras?: number;
  cantidadDias?: number;
  cantidadMeses?: number;
  prepago?: boolean;
  plazaAsignadaId?: string;
  subplazaAsignadaNumero?: number;
}

const EstadiaSchema = new Schema<IEstadia>(
  {
    ticket: { type: String, required: true, unique: true },
    patente: { type: String, required: true, uppercase: true },
    categoria: { type: String, enum: ['Automóvil', 'Motocicleta', 'Camioneta', 'Otros'], required: true },
    cliente: { nombre: String, apellido: String, dni: String, telefono: String },
    tarifaId: { type: Schema.Types.ObjectId, ref: 'Tarifa', required: true },
    operadorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, alias: 'operatorId' },
    parkinglotId: { type: Schema.Types.ObjectId, ref: 'ParkingLot', required: true },
    horaEntrada: { type: Date, default: Date.now },
    horaSalida: Date,
    horaExpiracion: Date,
    estado: { type: String, enum: ['activa', 'cerrada', 'prepago'], default: 'activa' },
    totalCobrado: Number,
    metodoPago: { type: String, enum: ['efectivo', 'tarjeta', 'qr', 'otros'] },
    tipoEstadia: { type: String, enum: ['hora', 'dia', 'libre', 'mensual'], required: true },
    cantidadHoras: { type: Number, default: 0, validate: { validator: function (this: IEstadia, value: number) { return this.tipoEstadia !== 'hora' || value > 0; }, message: 'cantidadHoras debe ser mayor a 0 cuando el tipoEstadia es "hora"' } },
    cantidadDias: { type: Number, default: 0, validate: { validator: function (this: IEstadia, value: number) { return this.tipoEstadia !== 'dia' || value > 0; }, message: 'cantidadDias debe ser mayor a 0 cuando el tipoEstadia es "dia"' } },
    cantidadMeses: { type: Number, default: 0, validate: { validator: function (this: IEstadia, value: number) { return this.tipoEstadia !== 'mensual' || value > 0; }, message: 'cantidadMeses debe ser mayor a 0 cuando el tipoEstadia es "mensual"' } },
    prepago: { type: Boolean, default: false },
    plazaAsignadaId: { type: Schema.Types.ObjectId, ref: 'Plaza', default: null },
    subplazaAsignadaNumero: { type: Number, default: null },
  },
  { timestamps: true }
);

export default models.Estadia || mongoose.model<IEstadia>('Estadia', EstadiaSchema);
