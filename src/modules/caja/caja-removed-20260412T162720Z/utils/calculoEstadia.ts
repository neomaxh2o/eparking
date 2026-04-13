import type { TarifaSnapshot, TicketCaja } from '../types/caja.types';

export interface ResultadoCalculoEstadia {
  total: number;
  detalle: string;
  tiempoTotal: string;
  cantidad?: number;
  diffMin: number;
}

export function calcularDiffMin(horaEntrada: string, horaSalida?: string): number {
  const entrada = new Date(horaEntrada).getTime();
  const salida = horaSalida ? new Date(horaSalida).getTime() : Date.now();

  if (Number.isNaN(entrada) || Number.isNaN(salida)) {
    return 0;
  }

  return Math.max(0, Math.ceil((salida - entrada) / (1000 * 60)));
}

export function calcularTiempoTotal(horaEntrada: string, horaSalida?: string): string {
  const entrada = new Date(horaEntrada).getTime();
  const salida = horaSalida ? new Date(horaSalida).getTime() : Date.now();

  if (Number.isNaN(entrada) || Number.isNaN(salida) || salida < entrada) {
    return '0h 0m 0s';
  }

  const diffMs = salida - entrada;
  const horas = Math.floor(diffMs / (1000 * 60 * 60));
  const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const segundos = Math.floor((diffMs % (1000 * 60)) / 1000);

  return `${horas}h ${minutos}m ${segundos}s`;
}

export function calcularEstadia(
  ticket: Pick<TicketCaja, 'horaEntrada' | 'horaSalida' | 'tipoEstadia' | 'totalCobrado'>,
  tarifa?: TarifaSnapshot,
): ResultadoCalculoEstadia {
  if (!ticket.horaEntrada) {
    return {
      total: 0,
      detalle: '',
      tiempoTotal: '0h 0m 0s',
      diffMin: 0,
    };
  }

  const tiempoTotal = calcularTiempoTotal(ticket.horaEntrada, ticket.horaSalida);
  const diffMin = calcularDiffMin(ticket.horaEntrada, ticket.horaSalida);

  const precioHora = tarifa?.tarifaHora ?? 0;
  const precioDia = tarifa?.tarifaDia ?? 0;
  const fraccionMinutos = tarifa?.fraccionMinutos ?? 60;
  const precioLibre = tarifa?.tarifaLibre ?? ticket.totalCobrado ?? 0;

  let total = 0;
  let detalle = '';
  let cantidad: number | undefined;

  switch (ticket.tipoEstadia) {
    case 'libre': {
      if (typeof tarifa?.tarifaBaseHora === 'number' && tarifa.tarifaBaseHora > 0) {
        const diffHoras = Math.ceil(diffMin / 60);
        total = diffHoras * tarifa.tarifaBaseHora;
        detalle = `${diffHoras} hora(s) x $${tarifa.tarifaBaseHora} = $${total}`;
      } else {
        total = precioLibre;
        detalle = `Estadía libre, monto: $${total}`;
      }
      break;
    }

    case 'hora': {
      cantidad = Math.ceil(diffMin / fraccionMinutos);
      total = cantidad * precioHora;
      detalle = `${cantidad} fracción(es) de ${fraccionMinutos} min x $${precioHora} = $${total}`;
      break;
    }

    case 'dia': {
      cantidad = Math.ceil(diffMin / (24 * 60));
      total = cantidad * precioDia;
      detalle = `${cantidad} día(s) x $${precioDia} = $${total}`;
      break;
    }

    default: {
      total = 0;
      detalle = 'Tipo de estadía no válido';
    }
  }

  return { total, detalle, tiempoTotal, cantidad, diffMin };
}
