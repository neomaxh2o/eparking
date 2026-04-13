import { v4 as uuidv4 } from 'uuid';

function maskEmail(email: string) {
  if (!email || typeof email !== 'string') return email;
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const shown = local.slice(0, 2);
  return `${shown}***@${domain}`;
}

function maskPII(obj: any) {
  if (!obj || typeof obj !== 'object') return obj;
  const copy: any = Array.isArray(obj) ? [] : {};
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (k === 'token' || k === 'password') {
      copy[k] = '***REDACTED***';
    } else if (k === 'email') {
      copy[k] = maskEmail(String(v));
    } else if (v && typeof v === 'object') {
      copy[k] = maskPII(v);
    } else {
      copy[k] = v;
    }
  }
  return copy;
}

// Prefer existing project logger if available
let projectLogger: any = null;
try {
  // dynamic require via eval to avoid bundler static resolution when module doesn't exist
  try {
    // eslint-disable-next-line no-eval
    const req = eval('require');
    const logger = req('@/shared/logger');
    if (logger && typeof logger.debug === 'function') projectLogger = logger;
  } catch (e) {
    // ignore
  }
} catch (e) {
  // ignore
}

export function debug(msg: string, meta?: any) {
  if (process.env.DEBUG_PARKING !== 'true') return;
  const payload = { msg, ...maskPII(meta) };
  if (projectLogger) {
    projectLogger.debug(JSON.stringify(payload));
  } else {
    console.debug(JSON.stringify(payload));
  }
}

export function ensureTraceId(headers: Headers | Record<string,string> | undefined) {
  try {
    const h = headers instanceof Headers ? headers.get('x-trace-id') || headers.get('X-Trace-Id') : (headers || {})['x-trace-id'] || (headers || {})['X-Trace-Id'];
    return h || uuidv4();
  } catch (e) {
    return uuidv4();
  }
}
