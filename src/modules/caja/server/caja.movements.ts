import CajaMovimiento from '@/models/CajaMovimiento';
import Turno from '@/models/Turno';
import Caja from '@/models/Caja';

export async function registerCajaMovimiento(input: {
  turnoId?: string | null;
  actorUserId?: string | null;
  actorRole?: 'admin' | 'owner' | 'operator' | 'system';
  sourceType: 'ticket' | 'abonado' | 'billing_document' | 'ajuste' | 'cierre';
  sourceId?: string | null;
  amount: number;
  paymentMethod?: string | null;
  paymentReference?: string | null;
  status?: string;
  snapshot?: Record<string, unknown>;
}) {
  const turno = input.turnoId ? await Turno.findById(input.turnoId).select('_id parkinglotId assignedParking cajaId cajaCode numeroCaja cajaNumero').lean() : null;
  const caja = turno && (turno as any).cajaId ? await Caja.findById((turno as any).cajaId).select('_id code numero parkinglotId').lean() : null;

  return CajaMovimiento.create({
    parkinglotId: (turno as any)?.parkinglotId ?? (turno as any)?.assignedParking ?? (caja as any)?.parkinglotId ?? null,
    cajaId: (turno as any)?.cajaId ?? (caja as any)?._id ?? null,
    cajaCode: (turno as any)?.cajaCode ?? (caja as any)?.code ?? '',
    turnoId: (turno as any)?._id ?? null,
    actorUserId: input.actorUserId ?? null,
    actorRole: input.actorRole ?? 'system',
    sourceType: input.sourceType,
    sourceId: input.sourceId ?? '',
    amount: Number(input.amount ?? 0),
    paymentMethod: input.paymentMethod ?? '',
    paymentReference: input.paymentReference ?? '',
    status: input.status ?? 'registrado',
    snapshot: {
      ...input.snapshot,
      turnoNumeroCaja: Number((turno as any)?.numeroCaja ?? (turno as any)?.cajaNumero ?? 0) || null,
      cajaCode: (turno as any)?.cajaCode ?? (caja as any)?.code ?? '',
    },
  });
}
