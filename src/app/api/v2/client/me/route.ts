import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  if (session.user.role !== 'client') {
    return NextResponse.json({ error: 'No autorizado para panel cliente' }, { status: 403 });
  }

  await dbConnect();

  const user = await User.findById(session.user.id)
    .select('-password')
    .populate('assignedParking', '_id name')
    .lean();

  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  return NextResponse.json(
    {
      id: String(user._id),
      email: user.email ?? '',
      role: user.role ?? 'guest',
      name: user.name ?? '',
      nombre: user.nombre ?? '',
      apellido: user.apellido ?? '',
      dni: user.dni ?? '',
      telefono: user.telefono ?? '',
      ciudad: user.ciudad ?? '',
      domicilio: user.domicilio ?? '',
      patenteVehiculo: user.patenteVehiculo ?? '',
      modeloVehiculo: user.modeloVehiculo ?? '',
      categoriaVehiculo: user.categoriaVehiculo ?? '',
      assignedParking:
        user.assignedParking && typeof user.assignedParking === 'object'
          ? {
              _id: String((user.assignedParking as any)._id ?? ''),
              name: String((user.assignedParking as any).name ?? ''),
            }
          : null,
    },
    { status: 200 },
  );
}
