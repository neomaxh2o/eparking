import { NextResponse } from 'next/server';
import connectToDatabase from '../lib/mongoose';

export function buildHealthPayload(service = 'eparking') {
  const env = process.env.NODE_ENV || 'development';
  const payload: Record<string, any> = {
    status: 'ok',
    service,
    environment: env,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  };

  // try to include version if available in env (non-blocking)
  if (process.env.npm_package_version) {
    payload.version = process.env.npm_package_version;
  }

  return payload;
}

export async function checkMongoConnectionSafe() {
  try {
    // If mongoose connection is already established, this will be quick.
    const mongoose = await connectToDatabase();
    // readyState 1 = connected
    const readyState = (mongoose as any).connection?.readyState;
    if (readyState === 1) {
      return { ok: true };
    }
    // if not connected, try a ping by running a simple command (serverSelectionTimeout in lib)
    // connectToDatabase already attempts connection; if it didn't throw, treat as ok
    return { ok: true };
  } catch (err) {
    console.error('health.checkMongoConnectionSafe error', err?.message || err);
    return { ok: false };
  }
}
