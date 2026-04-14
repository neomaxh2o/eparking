import { NextResponse } from 'next/server';
import { buildHealthPayload } from './_helpers';

export async function GET() {
  try {
    const payload = buildHealthPayload('eparking');
    return NextResponse.json(payload, { status: 200 });
  } catch (err) {
    console.error('GET /api/health error', err);
    return NextResponse.json({ status: 'error', service: 'eparking' }, { status: 500 });
  }
}
