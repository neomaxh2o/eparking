import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Turno from '@/models/Turno';
import Ticket from '@/models/Ticket';
import User from '@/models/User';
import TurnoReport from '@/models/TurnoReport';
import { describeCommercialUnit } from '@/modules/caja/server/commercial';

function money(value: number) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function date(value?: Date | string | null) {
  if (!value) return '-';
  const d = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleString();
}

function isTicketPaid(ticket: Record<string, unknown>) {
  const totalCobrado = Number(ticket.totalCobrado ?? 0);
  const prepago = Boolean(ticket.prepago);
  const metodoPago = String(ticket.metodoPago ?? '').trim();
  const estado = String(ticket.estado ?? '').trim();

  return totalCobrado > 0 || (prepago && totalCobrado > 0) || Boolean(metodoPago) || estado === 'cerrada';
}

function paymentLabel(ticket: Record<string, unknown>) {
  const metodoPago = String(ticket.metodoPago ?? '').trim();
  const totalCobrado = Number(ticket.totalCobrado ?? 0);
  const prepago = Boolean(ticket.prepago);

  if (metodoPago) return metodoPago;
  if (prepago && totalCobrado > 0) return 'prepago / no especificado';
  return '-';
}

function commercialStatus(ticket: Record<string, unknown>) {
  return isTicketPaid(ticket) ? 'COBRADO' : 'NO COBRADO';
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();
    const { id } = await context.params;

    const turno = await Turno.findById(id).lean();
    if (!turno) {
      return new NextResponse('Turno no encontrado', { status: 404 });
    }

    const tickets = await Ticket.find({ turnoId: turno._id }).sort({ horaEntrada: -1 }).lean();
    const operator = turno.operatorId
      ? await User.findById(turno.operatorId).select('name nombre apellido').lean()
      : null;

    const operatorName = operator
      ? ((operator as { name?: string }).name ||
          [
            (operator as { nombre?: string }).nombre,
            (operator as { apellido?: string }).apellido,
          ]
            .filter(Boolean)
            .join(' '))
      : String(turno.operatorName ?? turno.operatorId ?? '-');

    const totals = tickets.reduce(
      (acc, ticket) => {
        const total = Number(ticket.totalCobrado ?? 0);
        acc.total += total;
        if (ticket.metodoPago === 'tarjeta') acc.tarjeta += total;
        else if (ticket.metodoPago === 'qr') acc.qr += total;
        else if (ticket.metodoPago === 'otros') acc.otros += total;
        else if (isTicketPaid(ticket as Record<string, unknown>)) acc.efectivo += total;

        if (isTicketPaid(ticket as Record<string, unknown>)) acc.cobrados += 1;
        else acc.noCobrados += 1;
        if (ticket.prepago) acc.prepagos += 1;
        if (ticket.tipoEstadia === 'hora') acc.porHora += 1;
        if (ticket.tipoEstadia === 'dia') acc.porDia += 1;
        if (ticket.tipoEstadia === 'libre') acc.libres += 1;
        return acc;
      },
      {
        total: 0,
        efectivo: 0,
        tarjeta: 0,
        qr: 0,
        otros: 0,
        cobrados: 0,
        noCobrados: 0,
        prepagos: 0,
        porHora: 0,
        porDia: 0,
        libres: 0,
      },
    );

    const liquidacion = turno.liquidacion as
      | {
          efectivo?: number;
          tarjeta?: number;
          otros?: number;
          totalDeclarado?: number;
          totalSistema?: number;
          diferencia?: number;
          tipoDiferencia?: string;
          observacion?: string;
          fechaLiquidacion?: Date | string;
        }
      | undefined;

    const rows = tickets
      .map(
        (ticket) => `
          <tr>
            <td>${ticket.ticketNumber ?? '-'}</td>
            <td>${ticket.patente ?? '-'}</td>
            <td>${describeCommercialUnit(ticket as Record<string, unknown> & { tipoEstadia?: 'hora' | 'dia' | 'libre'; cantidadHoras?: number; cantidadDias?: number; tarifa?: { tipoEstadiaAplicada?: 'hora' | 'dia' | 'libre'; cantidadAplicada?: number } })}</td>
            <td>${ticket.prepago ? 'Sí' : 'No'}</td>
            <td>${String(ticket.estado ?? '-')} / ${commercialStatus(ticket as Record<string, unknown>)}</td>
            <td>${date(ticket.horaEntrada as Date | string)}</td>
            <td>${date(ticket.horaSalida as Date | string)}</td>
            <td>${paymentLabel(ticket as Record<string, unknown>)}</td>
            <td>${money(Number(ticket.totalCobrado ?? 0))}</td>
            <td>${ticket.detalleCobro ?? '-'}</td>
          </tr>
        `,
      )
      .join('');

    const cierreOperativo =
      (turno as { fechaCierreOperativo?: Date | string }).fechaCierreOperativo ??
      (String(turno.estado ?? '') === 'cerrado' ? (turno.fechaCierre as Date | string | undefined) : undefined);

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Reporte cierre turno ${String(turno.codigoTurno ?? turno._id)}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
    h1,h2,h3 { margin: 0 0 12px; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-bottom: 20px; }
    .card { border: 1px solid #ddd; border-radius: 12px; padding: 12px; }
    .muted { color: #666; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; text-align: left; vertical-align: top; }
    th { background: #f5f5f5; }
    .section { margin-top: 24px; }
    @media print { body { padding: 12px; } }
  </style>
</head>
<body>
  <h1>Reporte de cierre de turno</h1>
  <p class="muted">Generado: ${date(new Date())}</p>

  <div class="grid">
    <div class="card"><strong>Operador</strong><br/>${operatorName || '-'}</div>
    <div class="card"><strong>Caja</strong><br/>${Number(turno.numeroCaja ?? 1)}</div>
    <div class="card"><strong>Estado</strong><br/>${String(turno.estado ?? '-')}</div>
    <div class="card"><strong>Código turno</strong><br/>${String(turno.codigoTurno ?? turno._id ?? '-')}</div>
    <div class="card"><strong>Apertura</strong><br/>${date(turno.fechaApertura as Date | string)}</div>
    <div class="card"><strong>Cierre operativo</strong><br/>${date(cierreOperativo)}</div>
    <div class="card"><strong>Liquidación</strong><br/>${date(liquidacion?.fechaLiquidacion)}</div>
    <div class="card"><strong>Cierre final</strong><br/>${date(turno.fechaCierre as Date | string)}</div>
  </div>

  <div class="section">
    <h2>Resumen operativo</h2>
    <div class="grid">
      <div class="card"><strong>Tickets totales</strong><br/>${tickets.length}</div>
      <div class="card"><strong>Tickets cobrados</strong><br/>${totals.cobrados}</div>
      <div class="card"><strong>Tickets no cobrados</strong><br/>${totals.noCobrados}</div>
      <div class="card"><strong>Prepago</strong><br/>${totals.prepagos}</div>
      <div class="card"><strong>Por hora</strong><br/>${totals.porHora}</div>
      <div class="card"><strong>Por día</strong><br/>${totals.porDia}</div>
    </div>
  </div>

  <div class="section">
    <h2>Resumen financiero</h2>
    <div class="grid">
      <div class="card"><strong>Total sistema</strong><br/>${money(Number(liquidacion?.totalSistema ?? totals.total))}</div>
      <div class="card"><strong>Total declarado</strong><br/>${money(Number(liquidacion?.totalDeclarado ?? 0))}</div>
      <div class="card"><strong>Efectivo</strong><br/>${money(Number(liquidacion?.efectivo ?? totals.efectivo))}</div>
      <div class="card"><strong>Tarjeta</strong><br/>${money(Number(liquidacion?.tarjeta ?? totals.tarjeta))}</div>
      <div class="card"><strong>QR</strong><br/>${money(totals.qr)}</div>
      <div class="card"><strong>Otros</strong><br/>${money(Number(liquidacion?.otros ?? totals.otros))}</div>
      <div class="card"><strong>Diferencia</strong><br/>${money(Number(liquidacion?.diferencia ?? 0))}</div>
      <div class="card"><strong>Tipo diferencia</strong><br/>${String(liquidacion?.tipoDiferencia ?? 'sin_diferencia')}</div>
    </div>
    <div class="card"><strong>Observación</strong><br/>${liquidacion?.observacion || '-'}</div>
  </div>

  <div class="section">
    <h2>Detalle de tickets</h2>
    <table>
      <thead>
        <tr>
          <th>Ticket</th>
          <th>Patente</th>
          <th>Tipo</th>
          <th>Prepago</th>
          <th>Estado</th>
          <th>Entrada</th>
          <th>Salida</th>
          <th>Pago</th>
          <th>Total</th>
          <th>Detalle</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
</body>
</html>`;

    const firstTicket = tickets[0] as { parkinglotId?: unknown } | undefined;

    await TurnoReport.findOneAndUpdate(
      { turnoId: String(turno._id) },
      {
        turnoId: String(turno._id),
        parkinglotId: String(firstTicket?.parkinglotId ?? ''),
        operatorId: String(turno.operatorId ?? ''),
        operatorName: operatorName || '',
        numeroCaja: Number(turno.numeroCaja ?? 1),
        estado: String(turno.estado ?? ''),
        codigoTurno: String(turno.codigoTurno ?? ''),
        fechaApertura: turno.fechaApertura,
        fechaCierreOperativo: cierreOperativo ? new Date(String(cierreOperativo)) : undefined,
        fechaLiquidacion: liquidacion?.fechaLiquidacion ? new Date(String(liquidacion.fechaLiquidacion)) : undefined,
        fechaCierre: turno.fechaCierre,
        html,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="reporte-turno-${String(turno._id)}.html"`,
      },
    });
  } catch (error) {
    return new NextResponse(
      error instanceof Error ? error.message : 'Error generando reporte',
      { status: 500 },
    );
  }
}
