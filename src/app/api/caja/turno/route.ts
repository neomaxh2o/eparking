import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Turno from '@/models/Turno';
import User from '@/models/User';
import Ticket from '@/models/Ticket';
import Estadia from '@/models/Estadia';
import { calculateExpirationDate } from '@/lib/estadia/time';
import { toClientTurno } from '@/lib/serializers';
import type { TurnoDoc } from '@/lib/types/documents';

function toIso(value?: Date | string | null) {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export async function GET(req: NextRequest) {
  await dbConnect();

  try {
    const url = new URL(req.url);
    const operatorId = url.searchParams.get('operatorId');
    if (!operatorId) return NextResponse.json({ error: 'Falta operatorId' }, { status: 400 });

    const turnoRaw = await Turno.findOne({ operatorId, estado: 'abierto' }).lean<TurnoDoc>();
    if (!turnoRaw) return NextResponse.json(null);
    const turno = toClientTurno(turnoRaw);

    let operatorName = typeof turno.operatorName === 'string' ? turno.operatorName.trim() : '';

    if (!operatorName) {
      const operator = await User.findById(operatorId).select('name nombre apellido').lean<Record<string, unknown> | null>();
      if (operator) {
        const user = operator as Record<string, unknown>;
        operatorName =
          (typeof user.name === 'string' && user.name.trim()) ||
          [user.nombre, user.apellido]
            .filter((v) => typeof v === 'string' && String(v).trim() !== '')
            .join(' ') ||
          '';
      }
    }

    const ticketsDocs = await Ticket.find({ turnoId: turno._id }).sort({ createdAt: -1 }).lean<Record<string, unknown>[]>();
    const estadiasDocs = await Estadia.find({ operadorId: operatorId }).sort({ createdAt: -1 }).lean<Record<string, unknown>[]>();
    const estadiasByTicket = new Map(estadiasDocs.map((estadia) => [String((estadia as any).ticket), estadia]));

    const tickets = ticketsDocs.map((ticket) => {
      const estadia = estadiasByTicket.get(String((ticket as any).ticketNumber));
      const horaExpiracion =
        (estadia as any)?.horaExpiracion ??
        calculateExpirationDate({
          tipoEstadia: ((estadia as any)?.tipoEstadia ?? (ticket as any).tipoEstadia) as 'hora' | 'dia' | 'libre' | 'mensual',
          horaEntrada: (estadia as any)?.horaEntrada ?? (ticket as any).horaEntrada,
          cantidadHoras: (estadia as any)?.cantidadHoras ?? (ticket as any).cantidadHoras,
          cantidadDias: (estadia as any)?.cantidadDias ?? (ticket as any).cantidadDias,
          cantidadMeses: (estadia as any)?.cantidadMeses,
        });

      return {
        _id: String((ticket as any)._id),
        ticketNumber: String((ticket as any).ticketNumber ?? ''),
        patente: String((estadia as any)?.patente ?? (ticket as any).patente ?? ''),
        horaEntrada: toIso((estadia as any)?.horaEntrada ?? (ticket as any).horaEntrada),
        horaSalida: toIso((estadia as any)?.horaSalida ?? (ticket as any).horaSalida),
        horaExpiracion: toIso(horaExpiracion),
        totalCobrado: Number((estadia as any)?.totalCobrado ?? (ticket as any).totalCobrado ?? 0),
        tipoEstadia: String((estadia as any)?.tipoEstadia ?? (ticket as any).tipoEstadia ?? 'hora'),
        estado: String((estadia as any)?.estado === 'cerrada' ? 'cerrada' : (ticket as any).estado ?? 'activa'),
        metodoPago: (estadia as any)?.metodoPago ?? (ticket as any).metodoPago,
        prepago: Boolean((estadia as any)?.prepago ?? (ticket as any).prepago ?? false),
        categoria: (estadia as any)?.categoria ?? (ticket as any).categoria,
        createdAt: toIso((estadia as any)?.createdAt ?? (ticket as any).createdAt),
        updatedAt: toIso((estadia as any)?.updatedAt ?? (ticket as any).updatedAt),
      };
    });

    const totalTurnoReal = tickets.reduce((acc, ticket) => acc + Number(ticket.totalCobrado ?? 0), 0);

    return NextResponse.json({
      _id: String(turno._id),
      operatorId: String(turno.operatorId ?? operatorId),
      operatorName,
      fechaApertura: toIso(turno.fechaApertura),
      fechaCierre: toIso(turno.fechaCierre),
      fechaCierreOperativo: toIso((turno as { fechaCierreOperativo?: Date | string }).fechaCierreOperativo),
      tickets,
      totalTurno: totalTurnoReal,
      estado: String(turno.estado ?? 'abierto'),
      liquidacion: turno.liquidacion
        ? {
            efectivo: Number(turno.liquidacion.efectivo ?? 0),
            tarjeta: Number(turno.liquidacion.tarjeta ?? 0),
            otros: Number(turno.liquidacion.otros ?? 0),
            totalDeclarado: Number(turno.liquidacion.totalDeclarado ?? 0),
            totalSistema: Number(turno.liquidacion.totalSistema ?? 0),
            diferencia: Number(turno.liquidacion.diferencia ?? 0),
            tipoDiferencia: turno.liquidacion.tipoDiferencia ?? 'sin_diferencia',
            observacion: turno.liquidacion.observacion ?? '',
            fechaLiquidacion: toIso(turno.liquidacion.fechaLiquidacion),
          }
        : undefined,
      numeroCaja: Number((turno as { numeroCaja?: number }).numeroCaja ?? (turno as { cajaNumero?: number }).cajaNumero ?? 1),
      cajaNumero: Number((turno as { cajaNumero?: number }).cajaNumero ?? (turno as { numeroCaja?: number }).numeroCaja ?? 1),
      numeroTurno: Number((turno as { numeroTurno?: number }).numeroTurno ?? 0) || null,
      subturnoNumero: Number((turno as { subturnoNumero?: number }).subturnoNumero ?? 0),
      codigoTurno: String((turno as { codigoTurno?: string }).codigoTurno ?? ''),
    });
  } catch (error) {
    console.error('Error GET turno:', error);
    return NextResponse.json({ error: 'Error al obtener turno' }, { status: 500 });
  }
}
