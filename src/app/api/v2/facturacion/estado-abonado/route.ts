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
    const facturasRaw = await AbonadoInvoice.find({ abonadoId: abonado._id }).sort({ fechaEmision: -1 }).lean();
    const facturas = Array.isArray(facturasRaw) ? facturasRaw : [];
    const now = new Date();

    const vencidas = facturas.filter((f) => {
      if (!f || typeof f !== 'object') return false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ff = f as any;
      if (ff.estado === 'pagada') return false;
      if (!ff.fechaVencimiento) return false;
      try {
        return new Date(String(ff.fechaVencimiento)) < now;
      } catch (_) {
        return false;
      }
    });

    const saldoTotal = facturas.reduce((acc, f) => {
      if (!f || typeof f !== 'object') return acc;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ff = f as any;
      const monto = Number(ff.monto || 0) || 0;
      return acc + monto * (ff.estado === 'pagada' ? 0 : 1);
    }, 0);

    const estado = saldoTotal > 0 ? 'CON_DEUDA' : 'AL_DIA';

    // Return safe abonado object (omit sensitive fields)
    const safeAbonado = {
      _id: String((abonado as any)._id),
      numeroAbonado: (abonado as any).numeroAbonado,
      nombre: (abonado as any).nombre,
      apellido: (abonado as any).apellido,
      dni: (abonado as any).dni,
      telefono: (abonado as any).telefono,
      assignedParking: (abonado as any).assignedParking ?? null,
    };

    return NextResponse.json({ abonado: safeAbonado, facturas, vencidas, saldoTotal, estado }, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof Error) console.error('GET /facturacion/estado-abonado error', err.message);
    else console.error('GET /facturacion/estado-abonado error', String(err));
    return NextResponse.json({ error: 'error interno' }, { status: 500 });
  }
}
