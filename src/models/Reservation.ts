import mongoose, { Schema, Document } from 'mongoose';

export interface IReservation extends Document {
  user: mongoose.Types.ObjectId;
  parkingLot: mongoose.Types.ObjectId;
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string;
  ciudad: string;
  patenteVehiculo: string;
  modeloVehiculo: string;
  domicilio: string;
  formaPago: string;
  cantidadDias: number;
  categoriaVehiculo: 'Automóvil' | 'Camioneta' | 'Bicicleta' | 'Motocicleta' | 'Otros';
  startTime: Date;
  endTime: Date;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  amountPaid: number;
  processedBy?: mongoose.Types.ObjectId;
}

const ReservationSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    parkingLot: { type: Schema.Types.ObjectId, ref: 'ParkingLot', required: true },
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    dni: { type: String, required: true },
    telefono: { type: String, required: true },
    ciudad: { type: String, required: true },
    patenteVehiculo: { type: String, required: true },
    modeloVehiculo: { type: String, required: true },
    domicilio: { type: String, required: true },
    formaPago: { type: String, required: true },
    cantidadDias: { type: Number, required: true },
    categoriaVehiculo: { type: String, enum: ['Automóvil','Camioneta','Bicicleta','Motocicleta','Otros'], required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: { type: String, enum: ['pending','confirmed','cancelled','completed'], default: 'pending' },
    amountPaid: { type: Number },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.models.Reservation || mongoose.model<IReservation>('Reservation', ReservationSchema);
