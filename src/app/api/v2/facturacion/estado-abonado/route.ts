import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Abonado from '@/models/Abonado';
import AbonadoInvoice from '@/models/AbonadoInvoice';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('query') || '').trim();

    if (!q) return NextResponse.json({ error: 'query requerido' }, { status: 400 });

    // try numeric search (numeroAbonado)
    let abonado = null;
    if (/^\d+$/.test(q)) {
      abonado = await Abonado.findOne({ numeroAbonado: Number(q) }).lean();
    }

    // try dni
    if (!abonado) {
      abonado = await Abonado.findOne({ dni: q }).lean();
    }

    // try patente in vehiculos
    if (!abonado) {
      abonado = await Abonado.findOne({ 'vehiculos.patente': q }).lean();
    }

    // try name partial
    if (!abonado) {
      abonado = await Abonado.findOne({ $or: [{ nombre: q }, { apellido: q }, { nombre: new RegExp(q, 'i') }, { apellido: new RegExp(q, 'i') }] }).lean();
    }

    if (!abonado) return NextResponse.json({ abonado: null, facturas: [], vencidas: [], saldoTotal: 0, estado: 'AL_DIA' }, { status: 200 });

    // fetch invoices for abonado
    const facturas = await AbonadoInvoice.find({ abonadoId: abonado._id }).sort({ fechaEmision: -1 }).lean();
    const now = new Date();
    const vencidas = facturas.filter((f:any) => f.estado !== 'pagada' && f.fechaVencimiento && new Date(f.fechaVencimiento) < now);

    const saldoTotal = facturas.reduce((acc:any, f:any) => acc + (Number(f.monto || 0) * (f.estado === 'pagada' ? 0 : 1)), 0);
    const estado = saldoTotal > 0 ? 'CON_DEUDA' : 'AL_DIA';

    // Return safe abonado object (omit sensitive fields)
    const safeAbonado = {
      _id: String(abonado._id),
      numeroAbonado: abonado.numeroAbonado,
      nombre: abonado.nombre,
      apellido: abonado.apellido,
      dni: abonado.dni,
      telefono: abonado.telefono,
      assignedParking: abonado.assignedParking ?? null,
    };

    return NextResponse.json({ abonado: safeAbonado, facturas, vencidas, saldoTotal, estado }, { status: 200 });
  } catch (err:any) {
    console.error('GET /facturacion/estado-abonado error', err?.message || err);
    return NextResponse.json({ error: 'error interno' }, { status: 500 });
  }
}
