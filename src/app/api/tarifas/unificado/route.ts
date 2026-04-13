import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Tarifa } from '@/models/Tarifa';
import { ITarifaDoc } from '@/models/interfaces/Tarifa';

export async function POST(req: Request) {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      return NextResponse.json(
        { message: 'MONGODB_URI no está configurado' },
        { status: 500 }
      );
    }

    const body: Partial<ITarifaDoc> = await req.json();
    const { parkinglotId, category, tarifasHora, tarifasPorDia, tarifaMensual, tarifaLibre } = body;

    if (!parkinglotId || !category) {
      return NextResponse.json(
        { message: 'Falta parkinglotId o category' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(String(parkinglotId))) {
      return NextResponse.json(
        { message: 'parkinglotId inválido. Debe ser un ObjectId válido.' },
        { status: 400 }
      );
    }

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    const normalizedParkinglotId = new mongoose.Types.ObjectId(String(parkinglotId));

    const existing = await Tarifa.findOne({
      parkinglotId: normalizedParkinglotId,
      category,
    });

    if (existing) {
      if (tarifasHora?.length) existing.tarifasHora.push(...tarifasHora);
      if (tarifasPorDia?.length) existing.tarifasPorDia.push(...tarifasPorDia);
      if (tarifaMensual?.length) existing.tarifaMensual.push(...tarifaMensual);
      if (tarifaLibre?.length) existing.tarifaLibre.push(...tarifaLibre);

      const updated = await existing.save();
      return NextResponse.json(updated, { status: 200 });
    } else {
      const nuevaTarifa = new Tarifa({
        parkinglotId: normalizedParkinglotId,
        category,
        tarifasHora: tarifasHora || [],
        tarifasPorDia: tarifasPorDia || [],
        tarifaMensual: tarifaMensual || [],
        tarifaLibre: tarifaLibre || [],
      });

      const created = await nuevaTarifa.save();
      return NextResponse.json(created, { status: 201 });
    }
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { message: err?.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
