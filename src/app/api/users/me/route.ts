import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/lib/mongoose';
import User from '@/models/User';
import '@/models/ParkingLot';

export async function GET() {
  try {
    await connectToDatabase();

    const session = await getServerSession(authOptions);
    const sessionUser = session?.user;

    if (!sessionUser?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await User.findById(sessionUser.id)
      .select('-password')
      .populate('assignedParking', '_id name')
      .lean();

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error en GET /api/users/me:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
