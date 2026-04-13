import type { IEstadia } from '@/models/Estadia'; // tu export actual del modelo

// Interfaz para UI que agrega propiedades calculadas y animadas
interface EstadiaUI extends IEstadia {
  montoEstimado: number;
  montoAnimado: number;
  detalleCobro?: string;
  color?: string;
  horaIngresoFormateada: string;
  tiempoTranscurrido: { horas: number; minutos: number; segundos: number };
  parpadeo: boolean;
  horaSalidaFormateada?: string;
}

// types/EstadiaUI.ts
export interface EstadiasAnimadas {
  _id: string;
  patente: string;
  categoria: string;
  ticket: string;
  tipoEstadia: 'hora' | 'dia' | 'libre' | 'mes' | 'mensual';

  horaEntrada?: string;
  horaSalida?: string;
  prepago?: boolean;
  cantidadHoras?: number;
  cantidadDias?: number;
  totalCobrado?: number;

  // Campos de animación
  montoEstimado: number;
  montoAnimado: number;
  detalleCobro?: string;
  color: string;
  horaIngresoFormateada: string;
  horaSalidaFormateada?: string; // ✅ agregamos esto
  tiempoTranscurrido: { horas: number; minutos: number; segundos: number };
  parpadeo: boolean;
  dias?: number;
  tiempoRestante?: { dias: number; horas: number; minutos: number };

  // ✅ NUEVOS CAMPOS OPCIONALES
  tiempoExcedido?: { dias: number; horas: number; minutos: number };
  montoExcedido?: number;
}

