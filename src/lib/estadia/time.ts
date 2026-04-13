import type { IEstadia } from '@/models/Estadia';

export function nowUtc() {
  return new Date();
}

export function toBuenosAiresString(value?: string | Date | null) {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
}

export function calculateExpirationDate(estadia: Pick<IEstadia, 'tipoEstadia' | 'horaEntrada' | 'cantidadHoras' | 'cantidadDias' | 'cantidadMeses'>) {
  const start = estadia.horaEntrada instanceof Date ? new Date(estadia.horaEntrada) : new Date(estadia.horaEntrada);
  if (Number.isNaN(start.getTime())) return undefined;

  const end = new Date(start);

  switch (estadia.tipoEstadia) {
    case 'hora':
      end.setHours(end.getHours() + Math.max(1, Number(estadia.cantidadHoras ?? 1)));
      return end;
    case 'dia':
      end.setDate(end.getDate() + Math.max(1, Number(estadia.cantidadDias ?? 1)));
      return end;
    case 'mensual':
      end.setMonth(end.getMonth() + Math.max(1, Number(estadia.cantidadMeses ?? 1)));
      return end;
    case 'libre':
    default:
      return undefined;
  }
}

export function calculateElapsedTime(from: string | Date, to: string | Date = nowUtc()) {
  const start = from instanceof Date ? from : new Date(from);
  const end = to instanceof Date ? to : new Date(to);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { hours: 0, minutes: 0, seconds: 0, totalMinutes: 0, label: '0h 0m 0s' };
  }

  const diffMs = Math.max(0, end.getTime() - start.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(diffMs / (1000 * 60));

  return {
    hours,
    minutes,
    seconds,
    totalMinutes,
    label: `${hours}h ${minutes}m ${seconds}s`,
  };
}
