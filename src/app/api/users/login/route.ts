import { NextResponse } from 'next/server';

export async function POST() {
return NextResponse.json(
{ error: 'Deprecated route. Use /api/auth/[...nextauth] credentials flow.' },
{ status: 410 }
);
}
