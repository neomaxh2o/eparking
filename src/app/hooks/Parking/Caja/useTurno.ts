'use client';

/**
 * @deprecated Use `@/modules/turnos/hooks/useTurnoCaja` directly when legacy shape adaptation is not required.
 * Legacy compatibility layer. Do not use in new code.
 */
import { useMemo } from 'react';
import { useTurnoCaja } from '@/modules/turnos/hooks/useTurnoCaja';

export interface TicketResumen {
  ticketNumber: string;
  patente: string;
  horaEntrada: Date;
  horaSalida?: Date;
  totalCobrado?: number;
  tipoEstadia?: 'hora' | 'dia' | 'libre';
  estado?: 'activa' | 'cerrada';
}

export interface LiquidacionTurno {
  efectivo: number;
  tarjeta: number;
  otros: number;
  totalDeclarado: number;
  totalSistema?: number;
  diferencia?: number;
  tipoDiferencia?: 'sin_diferencia' | 'sobrante' | 'faltante';
  observacion?: string;
  fechaLiquidacion: Date;
}

export interface TurnoData {
  _id: string;
  operatorId: string;
  operatorName?: string;
  fechaApertura: Date;
  fechaCierre?: Date;
  tickets: TicketResumen[];
  totalTurno: number;
  estado: 'abierto' | 'cerrado' | 'pendiente_liquidacion' | 'liquidado';
  liquidacion?: LiquidacionTurno;
  numeroCaja: number;
  cajaNumero?: number;
  numeroTurno?: number | null;
  subturnoNumero?: number;
  codigoTurno?: string;
}

function toTurnoData(input: ReturnType<typeof useTurnoCaja>['turno']): TurnoData | null {
  if (!input) return null;

  return {
    _id: input._id,
    operatorId: input.operatorId,
    fechaApertura: new Date(input.fechaApertura),
    fechaCierre: input.fechaCierre ? new Date(input.fechaCierre) : undefined,
    tickets: Array.isArray(input.tickets)
      ? input.tickets.map((ticket) => ({
          ticketNumber: ticket.ticketNumber,
          patente: ticket.patente,
          horaEntrada: new Date(ticket.horaEntrada),
          horaSalida: ticket.horaSalida ? new Date(ticket.horaSalida) : undefined,
          totalCobrado: ticket.totalCobrado ?? 0,
          tipoEstadia: ticket.tipoEstadia ?? 'libre',
          estado: ticket.estado ?? 'activa',
        }))
      : [],
    totalTurno: input.totalTurno,
    estado: input.estado,
    liquidacion: input.liquidacion
      ? {
          ...input.liquidacion,
          fechaLiquidacion: new Date(input.liquidacion.fechaLiquidacion),
        }
      : undefined,
    numeroCaja: input.numeroCaja,
    cajaNumero: input.numeroCaja,
  };
}

export const useTurno = (operatorId?: string) => {
  const turnoCaja = useTurnoCaja(operatorId);

  const turno = useMemo(() => toTurnoData(turnoCaja.turno), [turnoCaja.turno]);

  return {
    turno,
    loading: turnoCaja.loading,
    error: turnoCaja.error,
    fetchTurno: turnoCaja.fetchTurno,
    abrirTurno: async () => {
      const result = await turnoCaja.abrirTurno();
      return result ? toTurnoData(result) : null;
    },
    cerrarTurno: turnoCaja.cerrarTurno,
    liquidarTurno: async (
      efectivo: number,
      tarjeta: number,
      otros: number,
      observacion?: string,
    ) => {
      const result = await turnoCaja.liquidarTurno({ efectivo, tarjeta, otros, observacion });
      return result ? toTurnoData(result) : null;
    },
  };
};
