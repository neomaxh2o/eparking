import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import TurnoReport from '@/models/TurnoReport';
import { requireOwnerAdminSession } from '@/lib/turno-report-auth';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireOwnerAdminSession();
  if (!auth.authorized) {
    return new NextResponse(auth.error, { status: auth.status });
  }

  await dbConnect();
  const { id } = await context.params;

  const report = await TurnoReport.findById(id).lean();
  if (!report) {
    return new NextResponse('Reporte no encontrado', { status: 404 });
  }

  return new NextResponse(String(report.html ?? ''), {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="reporte-turno-${String(report.turnoId)}.html"`,
    },
  });
}
