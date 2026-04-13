import { getServerSession } from 'next-auth/next';
import { getToken } from 'next-auth/jwt';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import type { NextRequest } from 'next/server';

// Ensure the current server session is an operator/owner/admin and return the session
// Accept the current request so getServerSession can read cookies from it. Fall back to getToken if needed.
export async function requireOperatorSession(req?: NextRequest) {
  let session: any = null;

  if (req) {
    try {
      // try to obtain session using server helper with request context
      session = await getServerSession(req as any, undefined as any, authOptions);
    } catch (e) {
      // ignore and try token fallback
      session = null;
    }
  }

  if (!session?.user) {
    // fallback to JWT token decode from cookie/header
    try {
      // debug: log presence of cookies header (mask values)
      try {
        const cookieHeader = req?.headers.get('cookie') || '';
        if (cookieHeader) {
          const masked = cookieHeader.split(';').map(c=>c.trim().split('=')).map(([k,v])=>`${k}=${v? (v.slice(0,3)+"..."+v.slice(-3)) : ''}`).join('; ');
          console.log('[auth.debug] cookie header present:', masked);
        } else {
          console.log('[auth.debug] no cookie header on request');
        }
      } catch (e){ console.log('[auth.debug] cookie inspect failed'); }

      const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET, secureCookie: false });
      console.log('[auth.debug] getToken result:', token ? { id: token.id ?? token.sub, role: token.role } : null);
      if (token) {
        // normalize token into session-like object
        session = { user: { _id: token.id ?? token.sub, id: token.id ?? token.sub, email: token.email, role: token.role } };
      }
    } catch (e) {
      console.log('[auth.debug] getToken failed', (e as any)?.message || e);
      session = null;
    }
  }

  if (!session?.user) {
    throw new Error('No autenticado');
  }

  const role = session.user.role;
  if (role !== 'operator' && role !== 'owner' && role !== 'admin') {
    throw new Error('No autorizado');
  }

  return session;
}
