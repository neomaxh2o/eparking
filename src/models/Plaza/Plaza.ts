// models/Plaza.ts
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

export interface Segmentacion {
  categoria: "mensual" | "hora" | "dia" | "libre";
  desde: number;
  hasta: number;
}

export interface IPlaza extends Document {
  _id: Types.ObjectId;
  nombre: string; // Nombre de la playa
  descripcion?: string; // Descripción opcional
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
      ticketNumber: { type: String, required: false },
      patente: { type: String, required: false },
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
    nombre: { type: String, required: true }, // 🔹 Nombre de la playa
    descripcion: { type: String, default: "" }, // 🔹 Descripción opcional
    categoria: {
      type: String,
      enum: ["mensual", "hora", "dia", "libre"],
      required: true,
    },
    configurable: { type: Boolean, default: true },
    plazasFisicas: { type: [SubPlazaSchema], default: [] },
    parkinglotId: { type: Schema.Types.ObjectId, ref: "ParkingLot", default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        // Convertimos ObjectId a string para la salida JSON
        ret._id = ret._id.toString();
        ret.parkinglotId = ret.parkinglotId ? ret.parkinglotId.toString() : null;
        return ret;
      },
    },
  }
);

export default mongoose.models.Plaza || mongoose.model<IPlaza>("Plaza", PlazaSchema);
