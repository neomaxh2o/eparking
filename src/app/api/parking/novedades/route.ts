import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import { Novedad } from '@/models/Novedad';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

await connectToDatabase();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const userId = session.user.id;  // asumiendo que guardás el id en el token
    const userParkingId = (session.user as any).assignedParkingId; // o donde tengas la playa asignada

    const { searchParams } = new URL(request.url);

    // Parámetros opcionales
    const parkingIdParam = searchParams.get('parkingId');

    // Construir filtro con OR para mostrar novedades relevantes
    const filter: any = {
      $or: [
        { isGlobal: true }, // novedades globales
        { parkingId: userParkingId }, // novedades de su playa
        { recipientParkings: userParkingId }, // novedades dirigidas a su playa
        { recipients: userId }, // novedades dirigidas a él
        { author: session.user.name || session.user.email }, // novedades que él publicó (si quiere verlas)
      ],
    };

    // Si se pasó parkingId por query, agregamos filtro adicional (ejemplo: para admin o filtro específico)
    if (parkingIdParam) {
      filter.$or.push({ parkingId: parkingIdParam });
    }

    const novedades = await Novedad.find(filter)
      .sort({ date: -1 })
      .limit(20);

    return NextResponse.json(novedades);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener novedades' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.title || !body.description) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const nuevaNovedad = new Novedad({
      title: body.title,
      description: body.description,
      author: body.author || session.user.name || session.user.email || 'Anon',
      category: body.category || 'general',
      date: body.date ? new Date(body.date) : new Date(),
      parkingId: body.parkingId || null,
      recipients: body.recipients || [],           // array de userIds destinatarios
      recipientParkings: body.recipientParkings || [], // array de parkingIds destinatarios
      isGlobal: body.isGlobal || false,            // boolean para visibilidad global
    });

    await nuevaNovedad.save();

    return NextResponse.json(nuevaNovedad, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear novedad' }, { status: 500 });
  }
}
