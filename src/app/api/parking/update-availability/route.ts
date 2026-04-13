import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import ParkingLot from '@/models/ParkingLot';

export async function PATCH(req: NextRequest) {
  try {
    await connectToDatabase();

    const { id, isAvailable } = await req.json();

    if (!id || typeof isAvailable !== 'boolean') {
      return NextResponse.json(
        { error: 'ID e isAvailable son requeridos' },
        { status: 400 }
      );
    }

    const updated = await ParkingLot.findByIdAndUpdate(
      id,
      { isAvailable },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Playa no encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Disponibilidad actualizada',
      parking: updated,
    });
  } catch (error) {
    console.error('Error PATCH disponibilidad:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
