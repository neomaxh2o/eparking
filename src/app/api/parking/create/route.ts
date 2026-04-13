import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/lib/mongoose';
import ParkingLot from '@/models/ParkingLot';
import mongoose from 'mongoose';

export async function POST(req: Request) {
  console.log('[PARKING.CREATE] POST request received');
  try {
    await connectToDatabase();
    console.log('[PARKING.CREATE] Connected to DB');

    const session = await getServerSession(authOptions);
    console.log('[PARKING.CREATE] session:', session?.user ? { id: session.user.id, role: session.user.role } : null);

    const body = await req.json();
    console.log('[PARKING.CREATE] body:', JSON.stringify(body));

    let {
      owner,
      name,
      location,
      totalSpots,
      availableSpots,
      pricePerHour,
      schedule,
    } = body;

    // Authorization: require authenticated admin/owner
    if (!session?.user?.id) {
      console.log('[PARKING.CREATE] Unauthorized: no session');
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!['admin', 'owner'].includes(session.user.role)) {
      console.log('[PARKING.CREATE] Forbidden: insufficient role', session.user.role);
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // If there is a logged user, prefer its id as owner (PATCH_OWNER_FROM_SESSION)
    if (!owner && session?.user?.id) {
      owner = session.user.id;
    }

    console.log('[PARKING.CREATE] owner used:', owner);

    // Basic presence validation
    if (
      !owner ||
      !name ||
      !location?.address ||
      location.lat === undefined ||
      location.lng === undefined ||
      totalSpots === undefined ||
      availableSpots === undefined ||
      pricePerHour === undefined ||
      !schedule?.open ||
      !schedule?.close
    ) {
      console.log('[PARKING.CREATE] Missing fields');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate owner is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(owner)) {
      console.log('[PARKING.CREATE] owner invalid ObjectId:', owner);
      return NextResponse.json({ error: 'owner must be a valid user id' }, { status: 400 });
    }

    const newParking = new ParkingLot({
      owner: new mongoose.Types.ObjectId(owner),
      name,
      location,
      totalSpots,
      availableSpots,
      pricePerHour,
      schedule,
    });

    console.log('[PARKING.CREATE] saving parking...');
    await newParking.save();
    console.log('[PARKING.CREATE] saved parking id:', String(newParking._id));

    return NextResponse.json(
      { message: 'Parking lot created successfully', parkingLot: newParking },
      { status: 201 }
    );
  } catch (error) {
    console.error('[PARKING.CREATE] Error creating parking lot:', error);
    // If it's a cast/validation error, surface a 400
    const msg = (error && error.name === 'CastError') ? 'Invalid id or value provided' : 'Internal server error';
    const status = (error && error.name === 'CastError') ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
