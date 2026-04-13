import { calculateElapsedTime, nowUtc, toBuenosAiresString } from '@/lib/estadia/time';

export const getFechaActual = (): string => {
  return nowUtc().toISOString();
};

export const formatearFecha = (fecha: string | Date): string => {
  return toBuenosAiresString(fecha);
};

export const calcularTiempoTranscurrido = (horaEntrada: string | Date) => {
  const elapsed = calculateElapsedTime(horaEntrada);
  return {
    horas: elapsed.hours,
    minutos: elapsed.minutes,
    segundos: elapsed.seconds,
  };
};
