import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import User from '@/models/User';
import '@/models/ParkingLot'; // registra el modelo

export async function GET() {
  try {
    await connectToDatabase();

    const users = await User.find({}, '-password')
      .populate('assignedParking', '_id name')
      .lean();

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error en GET /api/users/list:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
