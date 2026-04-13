import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Turno from '@/models/Turno';
import Ticket from '@/models/Ticket';
import TurnoReport from '@/models/TurnoReport';
import User from '@/models/User';
import ParkingLot from '@/models/ParkingLot';
import { requireOwnerAdminSession } from '@/lib/turno-report-auth';

function normalizePaymentMethod(method?: string | null) {
  if (!method) return 'otro';
  const value = method.toLowerCase();
  if (value.includes('efec')) return 'efectivo';
  if (value.includes('tarj')) return 'tarjeta';
  if (value.includes('qr')) return 'qr';
  return 'otro';
}

export async function POST() {
  try {
    const session = await requireOwnerAdminSession();
    await connectToDatabase();

    const turnos = await Turno.find({}).lean();

    let processed = 0;
    let created = 0;
    let updated = 0;

    for (const turno of turnos) {
      processed += 1;

      const turnoId = String((turno as any)._id);
      const operatorId = (turno as any).operatorId ? String((turno as any).operatorId) : null;
      const assignedParking = (turno as any).assignedParking ? String((turno as any).assignedParking) : null;

      if (session.user.role === 'owner') {
        const parking = assignedParking ? await ParkingLot.findOne({ _id: assignedParking, owner: session.user.id }).select('_id').lean() : null;
        if (!parking) {
          continue;
        }
      }

      const [operator, parking, tickets] = await Promise.all([
        operatorId ? User.findById(operatorId).lean() : null,
        assignedParking ? ParkingLot.findById(assignedParking).lean() : null,
        Ticket.find({ turnoId }).lean(),
      ]);

      const totalAmount = tickets.reduce((acc: number, ticket: any) => acc + Number(ticket.totalCobrado ?? 0), 0);
      const documentsCount = tickets.length;
      const firstTicket = tickets[0] ?? null;
      const lastTicket = tickets[tickets.length - 1] ?? null;
      const paymentMethod = normalizePaymentMethod(lastTicket?.metodoPago ?? firstTicket?.metodoPago ?? null);

      const payload = {
        turnoId,
        ownerId: parking?.owner ? String(parking.owner) : null,
        parkinglotId: assignedParking,
        parkingName: parking?.name ?? '',
        operatorId,
        operatorName: `${(operator as any)?.nombre ?? ''} ${(operator as any)?.apellido ?? ''}`.trim(),
        ticketNumber: lastTicket?.ticketNumber ?? firstTicket?.ticketNumber ?? '',
        plate: lastTicket?.patente ?? firstTicket?.patente ?? '',
        paymentMethod,
        totalAmount,
        status: (turno as any).estado === 'cerrado' ? 'cerrado' : 'abierto',
        notes: (turno as any).observaciones ?? '',
        openedAt: (turno as any).fechaApertura ?? (turno as any).createdAt ?? null,
        closedAt: (turno as any).fechaCierre ?? null,
        metadata: {
          numeroCaja: (turno as any).numeroCaja ?? (turno as any).cajaNumero ?? null,
          esCajaAdministrativa: Boolean((turno as any).esCajaAdministrativa ?? false),
          ticketsCount: documentsCount,
        },
      };

      const existing = await TurnoReport.findOne({ turnoId }).lean();
      if (existing) {
        await TurnoReport.updateOne({ _id: (existing as any)._id }, { $set: payload });
        updated += 1;
      } else {
        await TurnoReport.create(payload);
        created += 1;
      }
    }

    return NextResponse.json(
      {
        ok: true,
        processed,
        created,
        updated,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('[api/v2/turno-reportes/backfill][POST]', error);
    return NextResponse.json(
      { error: error?.message || 'No se pudo reconstruir el histórico de cajas.' },
      { status: 500 },
    );
  }
}
