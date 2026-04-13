// interfaces/Novedad.ts

export interface Novedad {
  _id: string;
  title?: string;
  category?: string; // Puede ser undefined
  description: string;
  date: string;
  parkingId?: string | { _id: string }; // <--- importante
  author?: string;
  recipients?: string[];
  isGlobal?: boolean;
}

// Exportamos Parking para que pueda ser usado en otros archivos
export interface Parking {
  _id: string;
  name: string;
  ownerId?: string; // o assignedUserId
}
