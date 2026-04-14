import { NextResponse } from 'next/server';
import { checkMongoConnectionSafe } from '../_helpers';

export async function GET() {
  try {
    const res = await checkMongoConnectionSafe();
    if (res.ok) {
      return NextResponse.json(
        {
          status: 'ok',
          service: 'eparking',
          dependency: 'mongodb',
          db: 'connected',
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        status: 'error',
        service: 'eparking',
        dependency: 'mongodb',
        db: 'unavailable',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  } catch (err) {
    console.error('GET /api/health/db error', err);
    return NextResponse.json(
      {
        status: 'error',
        service: 'eparking',
        dependency: 'mongodb',
        db: 'unavailable',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
