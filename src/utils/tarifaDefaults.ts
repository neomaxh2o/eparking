import { TarifaHora, TarifaDia, TarifaMensual, TarifaLibre } from "@/interfaces/Tarifa/tarifa";

// Default para Tarifa por Hora
export const getDefaultTarifaHora = (): TarifaHora => ({
  tipoEstadia: "hora",
  cantidad: 0,
  precioUnitario: 0,
  precioTotal: 0,
  precioConDescuento: 0,
});

// Default para Tarifa por Día
export const getDefaultTarifaDia = (): TarifaDia => ({
  tipoEstadia: "dia",
  cantidad: 0,
  precioUnitario: 0,
  precioTotal: 0,
  precioConDescuento: 0,
});

// Default para Tarifa Mensual
export const getDefaultTarifaMensual = (): TarifaMensual => ({
  tipoEstadia: "mes",
  cantidad: 0,
  precioUnitario: 0,
  precioTotal: 0,
  precioConDescuento: 0,
});

// Default para Tarifa Libre
export const getDefaultTarifaLibre = (): TarifaLibre => ({
  tipoEstadia: "libre",
  precioUnitario: 0,
  precioTotal: 0,
  precioConDescuento: 0,
});
