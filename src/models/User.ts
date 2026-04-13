import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'client' | 'owner' | 'operator' | 'admin' | 'guest';
  assignedParking?: mongoose.Types.ObjectId | null;

  nombre?: string;
  apellido?: string;
  dni?: string;
  telefono?: string;
  ciudad?: string;
  domicilio?: string;
  patenteVehiculo?: string;
  modeloVehiculo?: string;
  categoriaVehiculo?: string;
  condicionFiscal?: 'responsable_inscripto' | 'monotributo' | 'exento' | 'consumidor_final' | 'no_categorizado';
  tipoDocumentoFiscal?: 'dni' | 'cuit' | 'otro';
  numeroDocumentoFiscal?: string;
  razonSocial?: string;
  puntoDeVenta?: string;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['client','owner','operator','admin','guest'], required: true },
    assignedParking: { type: Schema.Types.ObjectId, ref: 'ParkingLot', default: null },
    nombre: String,
    apellido: String,
    dni: String,
    telefono: String,
    ciudad: String,
    domicilio: String,
    patenteVehiculo: String,
    modeloVehiculo: String,
    categoriaVehiculo: String,
    condicionFiscal: { type: String, enum: ['responsable_inscripto', 'monotributo', 'exento', 'consumidor_final', 'no_categorizado'], default: 'consumidor_final' },
    tipoDocumentoFiscal: { type: String, enum: ['dni', 'cuit', 'otro'], default: 'dni' },
    numeroDocumentoFiscal: String,
    razonSocial: String,
    puntoDeVenta: String,
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
