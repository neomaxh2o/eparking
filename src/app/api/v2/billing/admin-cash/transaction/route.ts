import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongoose';
import Turno from '@/models/Turno';

export async function POST(req: NextRequest) {
  // Caja admin deshabilitada — respondemos 410 Gone
  return NextResponse.json({ error: 'Caja administrativa deshabilitada' }, { status: 410 });
}
