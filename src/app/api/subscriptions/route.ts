import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import SubscriptionModel, { ISubscriptionModel, ISubscription } from '@/models/Abono/Subscription';
import Plaza, { SubPlaza } from '@/models/Plaza/Plaza';
import Estadia from '@/models/Estadia';
import mongoose from 'mongoose';

const Subscription = SubscriptionModel as ISubscriptionModel;

export async function GET(req: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  console.log('[GET] userId:', userId);

  try {
    let subscriptions;
    if (userId) {
      subscriptions = await Subscription.find({ userId }).lean();
      console.log('[GET] Suscripciones filtradas por usuario:', subscriptions);
    } else {
      subscriptions = await Subscription.find().lean();
      console.log('[GET] Todas las suscripciones:', subscriptions);
    }
    return NextResponse.json(subscriptions);
  } catch (err: any) {
    console.error('[GET] Error fetching subscriptions:', err);
    return NextResponse.json({ error: 'Error fetching subscriptions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  await dbConnect();
  const data = await req.json();
  console.log('[POST] Datos recibidos para crear suscripción:', data);

  // Validar que vengan operadorId y tarifaId
  if (!data.operadorId || !data.tarifaId) {
    console.error('[POST] Falta operadorId o tarifaId en los datos:', data);
    return NextResponse.json({ error: 'Faltan operadorId o tarifaId' }, { status: 400 });
  }

  // Función para generar ticket legible
  const generarTicket = () => `T-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  try {
    // 1️⃣ Crear la suscripción
    const newSubscription = await Subscription.create(data);
    console.log('[POST] Suscripción creada:', newSubscription);

    // 2️⃣ Asignar plaza automáticamente
    let subscriptionWithPlaza: ISubscription & mongoose.Document;
    try {
      subscriptionWithPlaza = await Subscription.asignarPlazaDisponible(newSubscription._id.toString());
      console.log('[POST] Plaza asignada automáticamente:', subscriptionWithPlaza.assignedSubPlaza);
    } catch (err: any) {
      console.warn(`[POST] No se pudo asignar plaza automáticamente. Error: ${err.message}`);
      subscriptionWithPlaza = newSubscription;
    }

    // 3️⃣ Si es mensual y tiene plaza → crear Estadia automáticamente
    if (subscriptionWithPlaza.tipoAbono === 'mensual' && subscriptionWithPlaza.assignedSubPlaza) {
      const ticketGenerado = generarTicket();

      const estadiaMensual = await Estadia.create({
        ticket: ticketGenerado,                                // ✅ ticket legible
        subscriptionId: subscriptionWithPlaza._id.toString(),  // ✅ referencia al abono
        patente: (data.patenteVehiculo || '').toUpperCase(),
        categoria: data.categoriaVehiculo || 'Automóvil',
        tarifaId: data.tarifaId,
        operadorId: data.operadorId,
        parkinglotId: subscriptionWithPlaza.assignedParking,
        horaEntrada: subscriptionWithPlaza.fechaAlta || new Date(),
        horaSalida: subscriptionWithPlaza.vigenciaHasta || null,
        estado: 'activa',
        tipoEstadia: 'mensual',
        cantidadMeses: data.periodoExtension || 1,
        plazaAsignadaId: subscriptionWithPlaza.assignedSubPlaza.plazaId,
        subplazaAsignadaNumero: subscriptionWithPlaza.assignedSubPlaza.subPlazaNumero,
      });

      console.log('[POST] Estadia mensual creada automáticamente:', estadiaMensual.ticket);
    } else {
      console.log('[POST] No es abono mensual o no tiene plaza asignada, no se crea estadía.');
    }

    return NextResponse.json(subscriptionWithPlaza);
  } catch (err: any) {
    console.error('[POST] Error creando suscripción:', err);
    return NextResponse.json({ error: 'Error creating subscription' }, { status: 500 });
  }
}







export async function PUT(req: NextRequest) {
  await dbConnect();
  const data = await req.json();
  const { id, assignPlaza, ...updateData } = data;
  console.log('[PUT] Datos recibidos para actualizar suscripción:', data);

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    console.warn('[PUT] ID inválido:', id);
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    let updated: (ISubscription & mongoose.Document) | null =
      await Subscription.findByIdAndUpdate(id, updateData, { new: true });

    if (!updated) {
      console.warn('[PUT] Suscripción no encontrada para ID:', id);
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }
    console.log('[PUT] Suscripción actualizada:', updated);

    if (assignPlaza) {
      try {
        updated = await Subscription.asignarPlazaDisponible(id);
        console.log('[PUT] Plaza asignada automáticamente:', updated.assignedSubPlaza);
      } catch (err: any) {
        console.warn(`[PUT] No se pudo asignar plaza automáticamente. Error: ${err.message}`);
      }
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('[PUT] Error updating subscription:', err);
    return NextResponse.json({ error: 'Error updating subscription' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('id');

    if (!subscriptionId) {
      return NextResponse.json({ error: 'subscriptionId es requerido' }, { status: 400 });
    }

    // --- Buscar la suscripción ---
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return NextResponse.json({ error: 'Suscripción no encontrada' }, { status: 404 });
    }

    const { plazaId, subPlazaNumero } = subscription.assignedSubPlaza || {};
    console.log('[DELETE] Procesando liberación ->', { plazaId, subPlazaNumero });

    if (plazaId && subPlazaNumero !== undefined) {
      // --- Buscar plaza ---
      const plaza = await Plaza.findById(plazaId);
      if (!plaza) {
        return NextResponse.json({ error: 'Plaza no encontrada' }, { status: 404 });
      }

      // --- Buscar la subplaza ---
      const subplaza = plaza.plazasFisicas.find((p: SubPlaza) => p.numero === subPlazaNumero);

      if (subplaza) {
        console.log('[DELETE] Subplaza encontrada en documento de plaza:', subplaza);

        // --- Liberar subplaza ---
        subplaza.usuarioAbonado = null;
        subplaza.estado = 'disponible';
        subplaza.estadiaId = null;
        subplaza.ocupada = false;

        await plaza.save();
        console.log('[DELETE] Subplaza liberada correctamente');
      } else {
        console.warn('[DELETE] No se encontró subplaza con numero:', subPlazaNumero);
      }
    }

    // --- Cerrar o eliminar la estadía mensual asociada ---
    if (subscription.tipoAbono === 'mensual') {
      const estadia = await Estadia.findOne({ ticket: subscription._id.toString() });

      if (estadia) {
        estadia.estado = 'cerrada';
        estadia.horaSalida = new Date();
        await estadia.save();
        console.log('[DELETE] Estadia mensual cerrada automáticamente:', estadia._id);
      } else {
        console.warn('[DELETE] No se encontró estadia asociada al abono');
      }
    }

    // --- Eliminar la suscripción ---
    const deleted = await Subscription.findByIdAndDelete(subscriptionId);
    if (!deleted) {
      return NextResponse.json({ error: 'Suscripción no encontrada al eliminar' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Subscription deleted, plaza freed, and estadia closed successfully',
    });
  } catch (err: any) {
    console.error('[DELETE] Error deleting subscription:', err);
    return NextResponse.json({ error: 'Error deleting subscription' }, { status: 500 });
  }
}