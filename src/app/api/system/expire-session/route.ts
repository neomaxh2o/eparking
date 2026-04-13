import { NextResponse } from 'next/server';

export async function GET() {
  const res = NextResponse.json({ ok: true, message: 'Expiring session cookie, clearing storage and redirecting...' });
  // Expire next-auth cookies (common names used in this app)
  const expiry = new Date(0).toUTCString();
  res.headers.append('Set-Cookie', `next-auth.session-token=; Path=/; Expires=${expiry}; HttpOnly; SameSite=Lax`);
  res.headers.append('Set-Cookie', `next-auth.csrf-token=; Path=/; Expires=${expiry}; HttpOnly; SameSite=Lax`);
  // Also provide a small HTML page that will clear storage and redirect when visited by a browser
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Expiring session</title></head><body><script>try{localStorage.clear(); sessionStorage.clear();}catch(e){}; setTimeout(()=>{location.href='/'},500);</script><p>Session expired, redirecting...</p></body></html>`;
  const textRes = new NextResponse(html, { status: 200 });
  textRes.headers.append('Content-Type', 'text/html');
  textRes.headers.append('Set-Cookie', `next-auth.session-token=; Path=/; Expires=${expiry}; HttpOnly; SameSite=Lax`);
  textRes.headers.append('Set-Cookie', `next-auth.csrf-token=; Path=/; Expires=${expiry}; HttpOnly; SameSite=Lax`);
  return textRes;
}
