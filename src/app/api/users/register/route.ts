import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import User from '@/models/User';
import connectToDatabase from '@/lib/mongoose';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const session = await getServerSession(authOptions);
    const body = await req.json();
    const {
      name,
      email,
      password,
      role,
      assignedParking,
      nombre,
      apellido,
      dni,
      telefono,
      ciudad,
      domicilio,
      patenteVehiculo,
      modeloVehiculo,
      categoriaVehiculo,
      condicionFiscal,
      tipoDocumentoFiscal,
      numeroDocumentoFiscal,
      razonSocial,
      puntoDeVenta,
    } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      );
    }

    const requestedRole = role || 'client';
    const rolesValidos = ['client', 'owner', 'operator', 'admin', 'guest'];
    if (!rolesValidos.includes(requestedRole)) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 400 });
    }

    const isPrivilegedRole = requestedRole === 'owner' || requestedRole === 'operator' || requestedRole === 'admin';
    if (isPrivilegedRole) {
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'No autenticado para crear roles elevados' }, { status: 401 });
      }
      if (session.user.role !== 'admin' && session.user.role !== 'owner') {
        return NextResponse.json({ error: 'No autorizado para crear roles elevados' }, { status: 403 });
      }
    }

    const userRole = requestedRole;

    // Validación de assignedParking para todos los roles
    let parkingId: string | undefined;
    if (assignedParking) {
      const objectIdRegex = /^[0-9a-fA-F]{24}$/;
      if (!objectIdRegex.test(assignedParking)) {
        return NextResponse.json(
          { error: 'assignedParking debe ser un ObjectId válido' },
          { status: 400 }
        );
      }
      parkingId = assignedParking;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'El usuario ya existe' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUserData: any = {
      name,
      email,
      password: hashedPassword,
      role: userRole,
      assignedParking: parkingId,
      // Campos extendidos
      nombre,
      apellido,
      dni,
      telefono,
      ciudad,
      domicilio,
      patenteVehiculo,
      modeloVehiculo,
      categoriaVehiculo,
      condicionFiscal,
      tipoDocumentoFiscal,
      numeroDocumentoFiscal,
      razonSocial,
      puntoDeVenta,
    };

    const newUser = new User(newUserData);
    await newUser.save();

    return NextResponse.json(
      {
        message: 'Usuario registrado con éxito',
        userId: newUser._id.toString(),
        role: newUser.role,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error en POST /api/users/register:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
