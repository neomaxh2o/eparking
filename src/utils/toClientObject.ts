// utils/toClientObject.ts
import mongoose from 'mongoose';
import { Tarifa } from '@/interfaces/tarifa';

export function toClientObject(doc: any): Tarifa {
  return {
    _id: doc._id.toString(),
    parkinglotId: doc.parkinglotId ? doc.parkinglotId.toString() : '',
    category: doc.category ?? 'Automóvil',
    tipoEstadia: doc.tipoEstadia ?? 'hora',
    tarifasHora: doc.tarifasHora ?? [],
    tarifasPorDia: doc.tarifasPorDia ?? [],
    tarifaMensual: doc.tarifaMensual ?? [],
    tarifaLibre: doc.tarifaLibre ?? [],
    fechaCreacion: doc.fechaCreacion,
    fechaActualizacion: doc.fechaActualizacion,
  };
}

export function toClientArray(docs: any[]): Tarifa[] {
  return docs.map(toClientObject);
}
