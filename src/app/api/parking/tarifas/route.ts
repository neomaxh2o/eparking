// app/api/tarifas/route.ts
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Tarifa, TarifaHora, TarifaDia, TarifaMensual, TarifaLibre } from '@/models/Tarifa';
import connectToDatabase from '@/lib/mongoose';
import { toClientArray, toClientObject } from '@/utils/toClientObject';


// Conexión segura a MongoDB
async function ensureDbConnection() {
  if (mongoose.connection.readyState === 0) await connectToDatabase();
}

// ---------------- GET: obtener todas las tarifas o por parkingId ----------------
export async function GET(req: NextRequest) {
  try {
    await ensureDbConnection();
    const { searchParams } = new URL(req.url);
    const parkinglotId = searchParams.get('parkinglotId');

    let tarifas;
    if (parkinglotId) {
      tarifas = await Tarifa.find({ parkinglotId });
    } else {
      tarifas = await Tarifa.find();
    }

    // Normalizar IDs para frontend
    return NextResponse.json({ success: true, data: toClientArray(tarifas) });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

// ---------------- POST: crear nueva tarifa ----------------
export async function POST(req: NextRequest) {
  try {
    await ensureDbConnection();

    const body = await req.json();
    console.log('Payload recibido en backend:', body);

    // Mapear arrays de tarifas según tipo de estadía
    let tarifasHora: TarifaHora[] | undefined;
    let tarifasPorDia: TarifaDia[] | undefined;
    let tarifaMensual: TarifaMensual[] | undefined;
    let tarifaLibre: TarifaLibre[] | undefined;

    if (body.tarifasHora) {
      tarifasHora = body.tarifasHora.map((t: any) => ({
        cantidad: t.cantidad,
        precioUnitario: t.precioUnitario,
        bonificacionPorc: t.bonificacionPorc ?? 0,
        precioConDescuento: t.precioConDescuento,
        precioTotal: t.precioTotal,
      }));
    }

    if (body.tarifasPorDia) {
      tarifasPorDia = body.tarifasPorDia.map((t: any) => ({
        cantidad: t.cantidad,
        precioUnitario: t.precioUnitario,
        bonificacionPorc: t.bonificacionPorc ?? 0,
        precioConDescuento: t.precioConDescuento,
        precioTotal: t.precioTotal,
      }));
    }

    if (body.tarifaMensual) {
      tarifaMensual = body.tarifaMensual.map((t: any) => ({
        cantidad: t.cantidad,
        precioUnitario: t.precioUnitario,
        bonificacionPorc: t.bonificacionPorc ?? 0,
        precioConDescuento: t.precioConDescuento,
        precioTotal: t.precioTotal,
      }));
    }

    if (body.tarifaLibre) {
      tarifaLibre = body.tarifaLibre.map((t: any) => ({
        precioUnitario: t.precioUnitario,
        bonificacionPorc: t.bonificacionPorc ?? 0,
        precioConDescuento: t.precioConDescuento,
        precioTotal: t.precioTotal,
      }));
    }

    const nuevaTarifa = await Tarifa.create({
      parkinglotId: body.parkinglotId,
      category: body.category,
      tipoEstadia: body.tipoEstadia,
      tarifasHora,
      tarifasPorDia,
      tarifaMensual,
      tarifaLibre,
    });

    console.log('Tarifa creada con éxito:', nuevaTarifa);

    return NextResponse.json(
      { success: true, data: toClientObject(nuevaTarifa) },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error al crear tarifa:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}



// ---------------- PUT: actualizar tarifa existente ----------------
export async function PUT(req: NextRequest) {
  try {
    await ensureDbConnection();
    const body = await req.json();
    const { _id, ...updateData } = body;

    if (!_id) {
      return NextResponse.json(
        { success: false, error: 'Se requiere el _id de la tarifa' },
        { status: 400 }
      );
    }

    const tarifaActualizada = await Tarifa.findByIdAndUpdate(_id, updateData, {
      new: true,
    });

    if (!tarifaActualizada) {
      return NextResponse.json(
        { success: false, error: 'Tarifa no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: toClientObject(tarifaActualizada) });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

// ---------------- DELETE: borrar tarifa ----------------
export async function DELETE(req: NextRequest) {
  try {
    await ensureDbConnection();
    const id = req.nextUrl.pathname.split('/').pop(); // obtiene _id de /api/tarifas/:_id

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Se requiere el _id de la tarifa' },
        { status: 400 }
      );
    }

    const tarifaEliminada = await Tarifa.findByIdAndDelete(id);

    if (!tarifaEliminada) {
      return NextResponse.json(
        { success: false, error: 'Tarifa no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: toClientObject(tarifaEliminada) });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
