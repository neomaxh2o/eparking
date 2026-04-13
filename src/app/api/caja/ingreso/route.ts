import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Estadia from '@/models/Estadia';
import { Tarifa } from '@/models/Tarifa';
import User from '@/models/User';
import Turno from '@/models/Turno';
import { getFechaActual } from '@/app/helpers/fechaHelpers'; // <- helper de fechas

export async function POST(req: Request) {
  try {
    await connectToDatabase();

    // Desestructuramos los datos del frontend
    const {
      patente,
      categoria,
      cliente,
      tarifaId,
      operatorId,
      tipoEstadia,
      cantidad,
      horaEntrada,
      tarifaBaseHora,
      tarifa: montoEstimado
    } = await req.json();

    // Validar operador
    const operator = await User.findById(operatorId);
    if (!operator || operator.role !== 'operator') {
      return NextResponse.json({ error: 'Operador no válido' }, { status: 400 });
    }

    // Validar tarifa
    const tarifa = await Tarifa.findById(tarifaId);
    if (!tarifa) {
      return NextResponse.json({ error: 'Tarifa no encontrada' }, { status: 404 });
    }

    // Generar número de ticket único
    const ticketNumber = `T-${Date.now()}`;

    // Preparar datos de estadía
    const horaActual = horaEntrada ? new Date(horaEntrada) : new Date(getFechaActual());

    const estadiaData: any = {
      ticketNumber,
      patente,
      categoria,
      cliente,
      tarifaId: tarifa._id,
      operadorId: operator._id,
      tipoEstadia,
      horaEntrada: horaActual,
    };

    // Definir tarifas según tipo de estadía
    switch (tipoEstadia) {
      case 'hora':
      case 'dia':
        estadiaData.cantidad = cantidad ?? 1;
        estadiaData.tarifa = montoEstimado ?? 0;
        estadiaData.tarifaBaseHora = tarifaBaseHora ?? tarifa.tarifaHora ?? 0;
        break;

      case 'libre':
        estadiaData.tarifaBaseHora = tarifaBaseHora ?? tarifa.tarifaHora ?? 0;
        estadiaData.tarifa = montoEstimado ?? estadiaData.tarifaBaseHora;
        // No usamos cantidad
        break;

      default:
        estadiaData.tarifaBaseHora = tarifa.tarifaHora ?? 0;
        estadiaData.tarifa = montoEstimado ?? estadiaData.tarifaBaseHora;
    }

    // Crear la estadía
    const estadia = await Estadia.create(estadiaData);

    // Asociar ticket al turno abierto del operador
    const turno = await Turno.findOne({ operatorId: operator._id.toString(), estado: 'abierto' });
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
        totalCobrado: estadia.totalCobrado ?? 0
      });
      await turno.save();
    }

    return NextResponse.json(estadia, { status: 201 });

  } catch (error: any) {
    console.error('❌ Error en ingreso:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message, details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error registrando ingreso' }, { status: 500 });
  }
}
