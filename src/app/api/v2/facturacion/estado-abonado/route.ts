import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Abonado from '@/models/Abonado';
import AbonadoInvoice from '@/models/AbonadoInvoice';
import type { AbonadoDoc, InvoiceDoc } from '@/lib/types/documents';
import { toClientAbonado } from '@/lib/serializers';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('query') || '').trim();

    if (!q) return NextResponse.json({ error: 'query requerido' }, { status: 400 });

    // try numeric search (numeroAbonado)
    let abonado: AbonadoDoc | null = null;
    if (/^\d+$/.test(q)) {
      abonado = await Abonado.findOne({ numeroAbonado: Number(q) }).lean<AbonadoDoc>();
    }

    // try dni
    if (!abonado) {
      abonado = await Abonado.findOne({ dni: q }).lean<AbonadoDoc>();
    }

    // try patente in vehiculos
    if (!abonado) {
      abonado = await Abonado.findOne({ 'vehiculos.patente': q }).lean<AbonadoDoc>();
    }

    // try name partial
    if (!abonado) {
      abonado = await Abonado.findOne({ $or: [{ nombre: q }, { apellido: q }, { nombre: new RegExp(q, 'i') }, { apellido: new RegExp(q, 'i') }] }).lean<AbonadoDoc>();
    }

    if (!abonado) return NextResponse.json({ abonado: null, facturas: [], vencidas: [], saldoTotal: 0, estado: 'AL_DIA' }, { status: 200 });

    // fetch invoices for abonado
    const facturasRaw = await AbonadoInvoice.find({ abonadoId: abonado._id }).sort({ fechaEmision: -1 }).lean<InvoiceDoc[]>();
    const facturas = Array.isArray(facturasRaw) ? facturasRaw : [];
    const now = new Date();

    const vencidas = facturas.filter((f) => {
      if (!f) return false;
      if (f.estado === 'pagada') return false;
      if (!f.fechaVencimiento) return false;
      try {
        return new Date(String(f.fechaVencimiento)) < now;
      } catch (_) {
        return false;
      }
    });

    const saldoTotal = facturas.reduce((acc, f) => {
      if (!f) return acc;
      const monto = Number(f.monto || 0) || 0;
      return acc + monto * (f.estado === 'pagada' ? 0 : 1);
    }, 0);

    const estado = saldoTotal > 0 ? 'CON_DEUDA' : 'AL_DIA';

    // Safe abonado object
    const safeAbonado = toClientAbonado(abonado);

    return NextResponse.json({ abonado: safeAbonado, facturas, vencidas, saldoTotal, estado }, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof Error) console.error('GET /facturacion/estado-abonado error', err.message);
    else console.error('GET /facturacion/estado-abonado error', String(err));
    return NextResponse.json({ error: 'error interno' }, { status: 500 });
  }
}
