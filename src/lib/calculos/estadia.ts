import { IEstadia } from '@/models/Estadia';
import { ITarifa } from '@/models/Tarifa';

export function calcularDiffMin(entrada: Date, salida: Date = new Date()): number {
  return Math.floor((salida.getTime() - entrada.getTime()) / (1000 * 60));
}

export function calcularTiempoTotal(entrada: Date, salida: Date = new Date()): string {
  const diffMs = salida.getTime() - entrada.getTime();
  const horas = Math.floor(diffMs / (1000 * 60 * 60));
  const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const segundos = Math.floor((diffMs % (1000 * 60)) / 1000);
  return `${horas}h ${minutos}m ${segundos}s`;
}

type TarifaHoraItem = NonNullable<ITarifa['tarifasHora']>[number];
type TarifaDiaItem = NonNullable<ITarifa['tarifasPorDia']>[number];
type TarifaMensualItem = NonNullable<ITarifa['tarifaMensual']>[number];
type TarifaLibreItem = NonNullable<ITarifa['tarifaLibre']>[number];

function normalizeCantidad(value: unknown, fallback = 1) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function resolvePrecioUnitarioHora(item?: TarifaHoraItem | null) {
  if (!item) return 0;
  return Number(item.precioConDescuento ?? item.precioUnitario ?? item.precioTotal ?? 0);
}

function resolvePrecioUnitarioDia(item?: TarifaDiaItem | null) {
  if (!item) return 0;
  return Number(item.precioConDescuento ?? item.precioUnitario ?? item.precioTotal ?? 0);
}

function resolvePrecioUnitarioMensual(item?: TarifaMensualItem | null) {
  if (!item) return 0;
  return Number(item.precioConDescuento ?? item.precioUnitario ?? item.precioTotal ?? 0);
}

function resolvePrecioLibre(item?: TarifaLibreItem | null) {
  if (!item) return 0;
  return Number(item.precioConDescuento ?? item.precioUnitario ?? item.precioTotal ?? 0);
}

function calcularLibre(tarifa: ITarifa) {
  const libre = tarifa.tarifaLibre?.[0];
  const total = resolvePrecioLibre(libre);
  const detalle = `Estadía libre x $${total}`;
  return { total, detalle };
}

function calcularPorHora(diffMin: number, tarifa: ITarifa, cantidadManual?: number) {
  const fraccionMin = 60;
  const cantidadHoras = cantidadManual ?? Math.max(1, Math.ceil(diffMin / fraccionMin));
  const tarifas = [...(tarifa.tarifasHora ?? [])].sort((a, b) => (a.cantidad ?? 0) - (b.cantidad ?? 0));

  const exacta = tarifas.find((item) => normalizeCantidad(item.cantidad) === cantidadHoras);
  const fallback = tarifas[tarifas.length - 1];
  const seleccionada = exacta ?? fallback;
  const precioUnitario = resolvePrecioUnitarioHora(seleccionada);
  const baseCantidad = normalizeCantidad(seleccionada?.cantidad);

  const total = exacta
    ? Number(seleccionada?.precioTotal ?? precioUnitario * cantidadHoras)
    : cantidadHoras <= baseCantidad
      ? Number(seleccionada?.precioTotal ?? precioUnitario)
      : cantidadHoras * precioUnitario;

  const detalle = `${cantidadHoras} fracción(es) de ${fraccionMin} min (redondeo hacia arriba) x $${precioUnitario} = $${total}`;
  return { total, detalle, cantidadHoras };
}

function calcularPorDia(diffMin: number, tarifa: ITarifa, cantidadManual?: number) {
  const cantidadDias = cantidadManual ?? Math.max(1, Math.ceil(diffMin / (24 * 60)));
  const tarifas = [...(tarifa.tarifasPorDia ?? [])].sort((a, b) => (a.cantidad ?? 0) - (b.cantidad ?? 0));

  const exacta = tarifas.find((item) => normalizeCantidad(item.cantidad) === cantidadDias);
  const fallback = tarifas[tarifas.length - 1];
  const seleccionada = exacta ?? fallback;
  const precioUnitario = resolvePrecioUnitarioDia(seleccionada);
  const baseCantidad = normalizeCantidad(seleccionada?.cantidad);

  const total = exacta
    ? Number(seleccionada?.precioTotal ?? precioUnitario * cantidadDias)
    : cantidadDias <= baseCantidad
      ? Number(seleccionada?.precioTotal ?? precioUnitario)
      : cantidadDias * precioUnitario;

  const detalle = `${cantidadDias} día(s) x $${precioUnitario} = $${total}`;
  return { total, detalle, cantidadDias };
}

function calcularMensual(tarifa: ITarifa, cantidadManual?: number) {
  const cantidadMeses = cantidadManual ?? 1;
  const tarifas = [...(tarifa.tarifaMensual ?? [])].sort((a, b) => (a.cantidad ?? 0) - (b.cantidad ?? 0));

  const exacta = tarifas.find((item) => normalizeCantidad(item.cantidad) === cantidadMeses);
  const fallback = tarifas[tarifas.length - 1];
  const seleccionada = exacta ?? fallback;
  const precioUnitario = resolvePrecioUnitarioMensual(seleccionada);
  const baseCantidad = normalizeCantidad(seleccionada?.cantidad);

  const total = exacta
    ? Number(seleccionada?.precioTotal ?? precioUnitario * cantidadMeses)
    : cantidadMeses <= baseCantidad
      ? Number(seleccionada?.precioTotal ?? precioUnitario)
      : cantidadMeses * precioUnitario;

  const detalle = `${cantidadMeses} mes(es) x $${precioUnitario} = $${total}`;
  return { total, detalle, cantidadMeses };
}

export function calcularTotal(
  estadia: IEstadia,
  tarifa: ITarifa,
  diffMin: number,
  cantidadManual?: number,
): {
  total: number;
  detalle: string;
  cantidadHoras?: number;
  cantidadDias?: number;
  cantidadMeses?: number;
} {
  switch (estadia.tipoEstadia) {
    case 'hora':
      return calcularPorHora(diffMin, tarifa, cantidadManual);
    case 'dia':
      return calcularPorDia(diffMin, tarifa, cantidadManual);
    case 'libre':
      return calcularLibre(tarifa);
    case 'mensual':
      return calcularMensual(tarifa, cantidadManual);
    default:
      throw new Error(`Tipo de estadía no soportado: ${estadia.tipoEstadia}`);
  }
}
