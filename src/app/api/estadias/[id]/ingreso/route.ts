import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Estadia from '@/models/Estadia';
import { Tarifa } from '@/models/Tarifa';
import User from '@/models/User';
import Turno from '@/models/Turno';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const body: unknown = await req.json().catch(() => ({}));
    const payload = (body && typeof body === 'object') ? (body as Record<string, unknown>) : {};

    const patente = payload.patente as string | undefined;
    const categoria = payload.categoria as string | undefined;
    const cliente = payload.cliente as string | undefined;
    const tarifaId = payload.tarifaId as string | undefined;
    const operatorId = payload.operatorId as string | undefined;
    const tipoEstadia = payload.tipoEstadia as string | undefined;
    const cantidad = payload.cantidad as number | undefined;
    const horaEntrada = payload.horaEntrada as string | undefined;
    const tarifaBaseHora = payload.tarifaBaseHora as number | undefined;
    const montoEstimado = payload.tarifa as number | undefined;

    if (!operatorId) return NextResponse.json({ error: 'Operador no enviado' }, { status: 400 });

    // Validar operador
    const operator = await User.findById(operatorId).lean<Record<string, unknown> | null>();
    if (!operator || (operator.role as unknown) !== 'operator') {
      return NextResponse.json({ error: 'Operador no válido' }, { status: 400 });
    }

    // Validar tarifa
    const tarifa = await Tarifa.findById(tarifaId).lean<Record<string, unknown> | null>();
    if (!tarifa) {
      return NextResponse.json({ error: 'Tarifa no encontrada' }, { status: 404 });
    }

    // Generar número de ticket único
    const ticketNumber = `T-${Date.now()}`;

    // Preparar datos de estadía
    const estadiaData: Record<string, unknown> = {
      ticketNumber,
      patente,
      categoria,
      cliente,
      tarifaId: tarifa._id ?? tarifaId,
      operadorId: operator._id ?? operatorId,
      tipoEstadia,
      horaEntrada: horaEntrada ? new Date(horaEntrada) : new Date(),
    };

    if (tipoEstadia === 'hora' || tipoEstadia === 'dia') {
      estadiaData.cantidad = cantidad ?? 1;
      estadiaData.tarifa = montoEstimado ?? 0;
      estadiaData.tarifaBaseHora = tarifaBaseHora ?? (tarifa.tarifaHora as unknown as number) ?? 0;
    }

    if (tipoEstadia === 'libre') {
      estadiaData.tarifaBaseHora = tarifaBaseHora ?? (tarifa.tarifaHora as unknown as number) ?? 0;
      estadiaData.tarifa = montoEstimado ?? estadiaData.tarifaBaseHora;
    }

    // Crear la estadía
    const estadia = await Estadia.create(estadiaData);

    // Asociar ticket al turno abierto del operador
    const turno = await Turno.findOne({ operatorId: String(operator._id ?? operatorId), estado: 'abierto' });
    if (turno) {
      turno.tickets.push({
        ticketNumber: estadia.ticketNumber,
        patente: estadia.patente,
        categoria: estadia.categoria,
        tarifaId: estadia.tarifaId,
        operadorId: estadia.operadorId,
        tipoEstadia: estadia.tipoEstadia,
        horaEntrada: estadia.horaEntrada,
        estado: estadia.estado,
        totalCobrado: estadia.totalCobrado ?? 0,
      });
      await turno.save();
    }

    return NextResponse.json(estadia, { status: 201 });

  } catch (error: unknown) {
    console.error('❌ Error en ingreso:', error);
    if (error instanceof Error && error.name === 'ValidationError') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const e = error as any;
      return NextResponse.json({ error: e.message, details: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error registrando ingreso' }, { status: 500 });
  }
}
