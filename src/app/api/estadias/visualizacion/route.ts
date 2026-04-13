import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Estadia from '@/models/Estadia';
import { Tarifa } from '@/models/Tarifa';
import { calcularTotal } from '@/lib/calculos/estadia';

export async function GET(req: Request) {
  await dbConnect();

  try {
    const url = new URL(req.url);
    const ticketNumber = url.searchParams.get('ticketNumber');
    if (!ticketNumber) return NextResponse.json({ error: 'Falta ticketNumber' }, { status: 400 });

    const estadia = await Estadia.findOne({ ticketNumber, estado: 'activa' });
    if (!estadia) return NextResponse.json({ error: 'Estadía no encontrada' }, { status: 404 });

    const tarifa = await Tarifa.findById(estadia.tarifaId);
    if (!tarifa) return NextResponse.json({ error: 'Tarifa no encontrada' }, { status: 404 });

    const diffMin = Math.ceil((Date.now() - estadia.horaEntrada.getTime()) / (1000 * 60));
    const { total, detalle, cantidad } = calcularTotal(estadia, tarifa, diffMin);

    return NextResponse.json({
      ...estadia.toObject(),
      totalCobrado: total,
      detalleCobro: detalle,
      cantidad: estadia.tipoEstadia !== 'libre' ? cantidad : undefined,
      prepago: estadia.prepago ?? false,
    });
  } catch (error) {
    console.error('❌ Error GET ticket:', error);
    return NextResponse.json({ error: 'Error obteniendo ticket' }, { status: 500 });
  }
}
