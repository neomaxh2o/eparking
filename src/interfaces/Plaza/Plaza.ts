export interface SubPlaza {
  numero: number; // Número único de la plaza
  estado: "disponible" | "ocupada" | "reservada" | "bloqueada";
  ocupada: boolean;
  configurable: boolean; // Permite editar la plaza manualmente
  usuarioAbonado?: { ticketNumber: string; patente: string } | null;
  estadiaId?: string | null;
  notas?: string;
}

export interface Segmentacion {
  categoria: "mensual" | "hora" | "dia" | "libre";
  desde: number; // Número inicial de plaza
  hasta: number; // Número final de plaza
  plazas?: SubPlaza[]; // Opcional: lista de subplazas dentro del rango
}

export interface Plaza {
  _id: string;
  nombre: string; // Nombre de la playa o cochera
  descripcion?: string; // Descripción opcional
  parkinglotId: string; // Referencia al parking lot
  plazasFisicas: SubPlaza[]; // Lista de todas las plazas
  segmentaciones?: Segmentacion[]; // Segmentación por categorías y rangos
  categoria: "mensual" | "hora" | "dia" | "libre"; // Categoría principal
  createdAt?: string;
  updatedAt?: string;
}

// Para trabajar con Mongoose (Document)
export interface IPlaza extends Document {
  _id: string;
  nombre: string; // Nombre de la playa
  descripcion?: string; // Descripción opcional
  categoria: "mensual" | "hora" | "dia" | "libre"; // Categoría principal
  plazasFisicas: SubPlaza[];
  parkinglotId?: string | null;
  configurable: boolean;
  segmentaciones?: Segmentacion[]; // Segmentaciones opcionales
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface para crear o actualizar plaza de manera parcial
export interface PartialPlaza {
  name?: string;
  descripcion?: string;
  categoria?: "mensual" | "hora" | "dia" | "libre";
  plazasFisicas?: SubPlaza[];
  parkinglotId?: string;
  segmentaciones?: Segmentacion[];
  configurable?: boolean;
}
