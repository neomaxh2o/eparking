import mongoose, { Schema, Document, Types } from "mongoose";

export interface SubPlaza {
  numero: number;
  estado: "disponible" | "ocupada" | "reservada" | "bloqueada";
  ocupada: boolean;
  configurable: boolean;
  usuarioAbonado?: { ticketNumber: string; patente: string } | null;
  estadiaId?: Types.ObjectId | null;
  notas?: string;
}

export interface IPlaza extends Document {
  _id: Types.ObjectId;
  nombre: string;
  descripcion?: string;
  categoria: "mensual" | "hora" | "dia" | "libre";
  configurable: boolean;
  plazasFisicas: SubPlaza[];
  parkinglotId?: Types.ObjectId | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const SubPlazaSchema = new Schema<SubPlaza>(
  {
    numero: { type: Number, required: true },
    estado: {
      type: String,
      enum: ["disponible", "ocupada", "reservada", "bloqueada"],
      default: "disponible",
    },
    usuarioAbonado: {
      ticketNumber: { type: String },
      patente: { type: String },
    },
    estadiaId: { type: Schema.Types.ObjectId, ref: "Estadia", default: null },
    notas: { type: String, default: null },
    ocupada: { type: Boolean, default: false },
    configurable: { type: Boolean, default: true },
  },
  { _id: false }
);

const PlazaSchema: Schema<IPlaza> = new Schema(
  {
    nombre: { type: String, required: true },
    descripcion: { type: String, default: "" },
    categoria: { type: String, enum: ["mensual", "hora", "dia", "libre"], required: true },
    configurable: { type: Boolean, default: true },
    plazasFisicas: { type: [SubPlazaSchema], default: [] },
    parkinglotId: { type: Schema.Types.ObjectId, ref: "ParkingLot", default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        ret._id = ret._id.toString();
        ret.parkinglotId = ret.parkinglotId ? ret.parkinglotId.toString() : null;
        return ret;
      },
    },
  }
);

export default mongoose.models.Plaza || mongoose.model<IPlaza>("Plaza", PlazaSchema);
