import { Tarifa as TarifaInterface } from '@/interfaces/tarifa';

/**
 * Calcula tiempo transcurrido desde la hora de entrada
 */
export const calcularTiempoTranscurrido = (horaEntrada: string) => {
  const ahora = new Date();
  const inicio = new Date(horaEntrada); // toma en cuenta UTC o local
  let diffMs = ahora.getTime() - inicio.getTime();
  if (diffMs < 0) diffMs = 0; // evitar negativo

  const diffSec = Math.floor(diffMs / 1000);
  const horas = Math.floor(diffSec / 3600);
  const minutos = Math.floor((diffSec % 3600) / 60);
  const segundos = diffSec % 60;

  return { horas, minutos, segundos };
};

/**
 * Calcula el monto estimado según la tarifa y tipo de estadía
 */
export const calcularMontoEstimado = (
  tarifa: TarifaInterface | undefined,
  horaEntrada: string,
  tipoEstadia: 'hora' | 'dia' | 'libre' = 'hora'
): number => {
  if (!tarifa) return 0;

  const tiempo = calcularTiempoTranscurrido(horaEntrada);
  const diffMin = tiempo.horas * 60 + tiempo.minutos;

  const precioHora = tarifa.tarifaHora ?? 0;
  const precioDia = tarifa.tarifasPorDia?.[0]?.price ?? 0;
  const fraccionMinutos = 60;

  switch (tipoEstadia) {
    case 'hora':
      const fracciones = Math.ceil(diffMin / fraccionMinutos);
      return fracciones * precioHora;

    case 'dia':
      const dias = Math.ceil(diffMin / (24 * 60));
      return dias * precioDia;

    case 'libre':
      const horasLibres = diffMin / 60;
      return Math.max(precioHora * horasLibres, precioHora);

    default:
      return 0;
  }
};

/**
 * Genera detalle de cobro según tarifa y tipo de estadía
 */
export const generarDetalleCobro = (
  tarifa: TarifaInterface | undefined,
  minutos: number,
  tipoEstadia: 'hora' | 'dia' | 'libre' = 'hora'
): string => {
  if (!tarifa) return '';

  const precioHora = tarifa.tarifaHora ?? 0;
  const precioDia = tarifa.tarifasPorDia?.[0]?.price ?? 0;
  const fraccionMinutos = 60;

  switch (tipoEstadia) {
    case 'hora': {
      const fracciones = Math.ceil(minutos / fraccionMinutos);
      const montoHora = fracciones * precioHora;
      return `${fracciones} fracción(es) de ${fraccionMinutos} min x $${precioHora} = $${montoHora}`;
    }
    case 'dia': {
      const dias = Math.ceil(minutos / (24 * 60));
      const montoDia = dias * precioDia;
      return `${dias} día(s) x $${precioDia} = $${montoDia}`;
    }
    case 'libre': {
      const horasLibres = minutos / 60;
      const fraccionesLibres = Math.ceil(horasLibres);
      const montoLibre = Math.max(fraccionesLibres * precioHora, precioHora);
      return `${fraccionesLibres} fracción(es) de 1h x $${precioHora} = $${montoLibre}`;
    }
    default:
      return '';
  }
};

/**
 * Calcula color según tiempo transcurrido y tipo de estadía
 */
export const calcularColor = (
  tarifa: TarifaInterface | undefined,
  horaEntrada: string,
  tipoEstadia: 'hora' | 'dia' | 'libre' = 'hora'
): string => {
  if (!tarifa) return 'text-gray-700';
  if (tipoEstadia === 'libre') return 'text-green-700';

  const tiempo = calcularTiempoTranscurrido(horaEntrada);
  const diffMin = tiempo.horas * 60 + tiempo.minutos;

  const maxMinutos = tarifa.cantidadHoras ? tarifa.cantidadHoras * 60 : Infinity;

  if (diffMin < maxMinutos * 0.8) return 'text-green-700';
  if (diffMin < maxMinutos) return 'text-yellow-600';
  return 'text-red-600';
};
