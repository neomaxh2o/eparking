// src/interfaces/payloads.ts
import { SubTarifa, TarifaHora, TarifaDia, TarifaMensual, TarifaLibre, SubTarifaBase, Categoria } from '@/interfaces/Tarifa/tarifa';

export interface PayloadBase {
  ticket: string;
  patente: string;
  operadorId: string;
  parkinglotId: string;
  categoria: Categoria;
  horaEntrada?: string;
  horaSalida?: string;
}

export type PayloadPorTipo<T extends SubTarifa> =
  T extends TarifaHora & SubTarifaBase
    ? PayloadBase & {
        tipo: 'hora';
        cantidadHoras: number;
        precioUnitario: number;
        bonificacionPorc: number;
        precioConDescuento: number;
        precioTotal: number;
      }
  : T extends TarifaDia & SubTarifaBase
    ? PayloadBase & {
        tipo: 'dia';
        cantidadDias: number;
        precioUnitario: number;
        bonificacionPorc: number;
        precioConDescuento: number;
        precioTotal: number;
      }
  : T extends TarifaMensual & SubTarifaBase
    ? PayloadBase & {
        tipo: 'mes';
        cantidadMeses: number;
        precioUnitario: number;
        bonificacionPorc: number;
        precioConDescuento: number;
        precioTotal: number;
      }
  : T extends TarifaLibre & SubTarifaBase
    ? PayloadBase & {
        tipo: 'libre';
        precioUnitario: number;
        bonificacionPorc: number;
        precioConDescuento: number;
        precioTotal: number;
      }
  : never;
