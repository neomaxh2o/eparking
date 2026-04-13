'use client';

import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import type { Categoria } from '@/interfaces/Tarifa/tarifa';
import { calcularMontoEstimado, calcularColor, calcularTiempoTranscurrido, generarDetalleCobro } from '@/app/components/Parking/Caja/helpers/cajaHelpers';
import { EstadiasAnimadas } from '@/types/EstadiaUI';
import { IEstadia } from '@/interfaces/Estadias/estadias';

const ZONA_ARG = 'America/Argentina/Buenos_Aires';

const calcularTiempoRestante = (horaSalida?: string) => {
  if (!horaSalida) return undefined;
  const ahora = dayjs().tz(ZONA_ARG);
  const salida = dayjs(horaSalida).tz(ZONA_ARG);
  let diffMin = salida.diff(ahora, 'minute');
  if (diffMin < 0) diffMin = 0;
  const dias = Math.floor(diffMin / (60 * 24));
  const horas = Math.floor((diffMin % (60 * 24)) / 60);
  const minutos = diffMin % 60;
  return { dias, horas, minutos };
};

export function useEstadiasEnTiempoReal(
  estadias: IEstadia[],
  tab: 'activa' | 'cerrada' | 'prepago',
  getTarifaByCategory: (cat: Categoria) => any
) {
  const [estadiasEnTiempoReal, setEstadiasEnTiempoReal] = useState<EstadiasAnimadas[]>([]);

  useEffect(() => {
    const intervalAnimacion = setInterval(() => {
      const filtradas = estadias.filter((e) => {
        if (tab === 'prepago') return e.prepago === true;
        return e.estado === tab;
      });

      const nuevasEstadias = filtradas
        .map((e) => {
          if (!e.horaEntrada) return null;

          const fechaArg = dayjs(e.horaEntrada).tz(ZONA_ARG);
          const tipoEstadiaValido: 'hora' | 'dia' | 'libre' =
            e.tipoEstadia === 'mes' ? 'dia' : (e.tipoEstadia as 'hora' | 'dia' | 'libre');

          const tarifa = getTarifaByCategory(e.categoria as Categoria);

          let montoEstimado = 0;
          let detalleCobro: string | undefined;
          let dias: number | undefined;
          let tiempoTranscurrido = { horas: 0, minutos: 0, segundos: 0 };
          let tiempoRestante: { dias: number; horas: number; minutos: number } | undefined;
          let tiempoExcedido: { dias: number; horas: number; minutos: number } | undefined;
          let montoExcedido = 0;

          if (e.prepago) {
            dias = e.cantidadDias;
            const horas = e.cantidadHoras ?? 0;
            montoEstimado = e.totalCobrado ?? 0;

            detalleCobro = dias
              ? `${dias} día(s) x $${tarifa?.tarifaMensual?.[0]?.precioUnitario ?? 0} = $${montoEstimado}`
              : horas
                ? `${horas} hora(s) x $${tarifa?.tarifasHora?.[0]?.precioUnitario ?? 0} = $${montoEstimado}`
                : undefined;

            tiempoRestante = calcularTiempoRestante(e.horaSalida);

            if (e.estado === 'activa' && e.horaSalida) {
              const ahora = dayjs().tz(ZONA_ARG);
              const salida = dayjs(e.horaSalida).tz(ZONA_ARG);
              const diffMin = ahora.diff(salida, 'minute');

              if (diffMin > 0) {
                const diasEx = Math.floor(diffMin / (60 * 24));
                const horasEx = Math.floor((diffMin % (60 * 24)) / 60);
                const minutosEx = diffMin % 60;
                tiempoExcedido = { dias: diasEx, horas: horasEx, minutos: minutosEx };

                if (tipoEstadiaValido === 'hora') {
                  const tarifaHora = tarifa?.tarifasHora?.[0]?.precioUnitario ?? 0;
                  const horasTot = Math.ceil(diffMin / 60);
                  montoExcedido = horasTot * tarifaHora;
                } else if (tipoEstadiaValido === 'dia') {
                  const tarifaDia = tarifa?.tarifaMensual?.[0]?.precioUnitario ?? 0;
                  const diasTot = Math.ceil(diffMin / (60 * 24));
                  montoExcedido = diasTot * tarifaDia;
                }
              }
            }
          } else {
            tiempoTranscurrido = calcularTiempoTranscurrido(fechaArg.toISOString());
            const diffMin = tiempoTranscurrido.horas * 60 + tiempoTranscurrido.minutos;

            if (tipoEstadiaValido === 'libre') {
              const precioHora = tarifa?.tarifasHora?.[0]?.precioUnitario ?? 0;
              const horasTranscurridas = Math.ceil(diffMin / 60);
              montoEstimado = horasTranscurridas * precioHora;
              detalleCobro = `Libre: ${horasTranscurridas}h x $${precioHora} = $${montoEstimado}`;
            } else {
              montoEstimado = tarifa ? calcularMontoEstimado(tarifa, fechaArg.toISOString(), tipoEstadiaValido) : 0;
              detalleCobro = tarifa ? generarDetalleCobro(tarifa, diffMin, tipoEstadiaValido) : undefined;

              if (tipoEstadiaValido === 'dia') {
                const totalHoras = tiempoTranscurrido.horas + tiempoTranscurrido.minutos / 60;
                dias = Math.ceil(totalHoras / 24);
              }
            }
          }

          let horaIngresoFormateada = fechaArg.format('DD/MM/YYYY HH:mm');
          const hoy = dayjs().tz(ZONA_ARG);
          if (fechaArg.isSame(hoy, 'day')) {
            horaIngresoFormateada = fechaArg.format('HH:mm');
          }

          const estadiaPrev = estadiasEnTiempoReal.find((prev) => prev._id === e._id);
          const montoPrev = estadiaPrev?.montoAnimado ?? 0;
          const incremento = (montoEstimado - montoPrev) / 5;
          const montoAnimado = montoPrev + incremento;

          const parpadeo = e.prepago
            ? tiempoRestante
              ? tiempoRestante.dias * 24 * 60 + tiempoRestante.horas * 60 + tiempoRestante.minutos <= 60
              : false
            : montoEstimado > (estadiaPrev?.montoEstimado ?? 0);

          const color = e.prepago
            ? tiempoRestante
              ? tiempoRestante.dias * 24 * 60 + tiempoRestante.horas * 60 + tiempoRestante.minutos > 24 * 60
                ? 'from-green-100 to-green-50 text-green-700'
                : tiempoRestante.dias * 24 * 60 + tiempoRestante.horas * 60 + tiempoRestante.minutos > 60
                  ? 'from-yellow-100 to-yellow-50 text-yellow-700'
                  : 'from-red-100 to-red-50 text-red-700'
              : 'from-gray-100 to-gray-50 text-gray-700'
            : calcularColor(tarifa, fechaArg.toISOString(), tipoEstadiaValido);

          return {
            ...e,
            montoEstimado,
            montoAnimado,
            detalleCobro,
            color,
            horaIngresoFormateada,
            tiempoTranscurrido,
            parpadeo,
            dias,
            tiempoRestante,
            tiempoExcedido,
            montoExcedido,
          } as EstadiasAnimadas;
        })
        .filter(Boolean) as EstadiasAnimadas[];

      setEstadiasEnTiempoReal(nuevasEstadias);
    }, 500);

    return () => clearInterval(intervalAnimacion);
  }, [estadias, tab, getTarifaByCategory, estadiasEnTiempoReal]);

  return estadiasEnTiempoReal;
}
