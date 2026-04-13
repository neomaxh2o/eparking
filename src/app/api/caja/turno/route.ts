import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Turno from '@/models/Turno';
import User from '@/models/User';
import Ticket from '@/models/Ticket';
import Estadia from '@/models/Estadia';
import { calculateExpirationDate } from '@/lib/estadia/time';

function toIso(value?: Date | string | null) {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export async function GET(req: Request) {
  await dbConnect();

  try {
    const url = new URL(req.url);
    const operatorId = url.searchParams.get('operatorId');
    if (!operatorId) return NextResponse.json({ error: 'Falta operatorId' }, { status: 400 });

    const turno = await Turno.findOne({ operatorId, estado: 'abierto' }).lean();
    if (!turno) return NextResponse.json(null);

    let operatorName = typeof turno.operatorName === 'string' ? turno.operatorName.trim() : '';

    if (!operatorName) {
      const operator = await User.findById(operatorId).select('name nombre apellido').lean();
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

    const ticketsDocs = await Ticket.find({ turnoId: turno._id }).sort({ createdAt: -1 }).lean();
    const estadiasDocs = await Estadia.find({ operadorId: operatorId }).sort({ createdAt: -1 }).lean();
    const estadiasByTicket = new Map(estadiasDocs.map((estadia) => [String(estadia.ticket), estadia]));

    const tickets = ticketsDocs.map((ticket) => {
      const estadia = estadiasByTicket.get(String(ticket.ticketNumber));
      const horaExpiracion =
        estadia?.horaExpiracion ??
        calculateExpirationDate({
          tipoEstadia: (estadia?.tipoEstadia ?? ticket.tipoEstadia) as 'hora' | 'dia' | 'libre' | 'mensual',
          horaEntrada: estadia?.horaEntrada ?? ticket.horaEntrada,
          cantidadHoras: estadia?.cantidadHoras ?? ticket.cantidadHoras,
          cantidadDias: estadia?.cantidadDias ?? ticket.cantidadDias,
          cantidadMeses: estadia?.cantidadMeses,
        });

      return {
        _id: String(ticket._id),
        ticketNumber: String(ticket.ticketNumber ?? ''),
        patente: String(estadia?.patente ?? ticket.patente ?? ''),
        horaEntrada: toIso(estadia?.horaEntrada ?? ticket.horaEntrada),
        horaSalida: toIso(estadia?.horaSalida ?? ticket.horaSalida),
        horaExpiracion: toIso(horaExpiracion),
        totalCobrado: Number(estadia?.totalCobrado ?? ticket.totalCobrado ?? 0),
        tipoEstadia: String(estadia?.tipoEstadia ?? ticket.tipoEstadia ?? 'hora'),
        estado: String(estadia?.estado === 'cerrada' ? 'cerrada' : ticket.estado ?? 'activa'),
        metodoPago: estadia?.metodoPago ?? ticket.metodoPago,
        prepago: Boolean(estadia?.prepago ?? ticket.prepago ?? false),
        categoria: estadia?.categoria ?? ticket.categoria,
        createdAt: toIso(estadia?.createdAt ?? ticket.createdAt),
        updatedAt: toIso(estadia?.updatedAt ?? ticket.updatedAt),
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
