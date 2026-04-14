import connectToDatabase from '../../../lib/mongoose';

export function buildHealthPayload(service = 'eparking') {
  const env = process.env.NODE_ENV || 'development';
  const payload: Record<string, any> = {
    status: 'ok',
    service,
    environment: env,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  };

  if (process.env.npm_package_version) {
    payload.version = process.env.npm_package_version;
  }

  return payload;
}

export async function checkMongoConnectionSafe() {
  try {
    const mongoose = await connectToDatabase();
    const readyState = (mongoose as any).connection?.readyState;
    if (readyState === 1) return { ok: true };
    return { ok: true };
  } catch (err) {
    console.error('health.checkMongoConnectionSafe error', err?.message || err);
    return { ok: false };
  }
}
