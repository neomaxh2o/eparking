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
  const turnoDoc = (turno as unknown) as Record<string, unknown> | null;
  const caja = turnoDoc && String(turnoDoc.cajaId || '') ? await Caja.findById(String(turnoDoc.cajaId)).select('_id code numero parkinglotId').lean() : null;
  const cajaDoc = (caja as unknown) as Record<string, unknown> | null;

  const parkinglotId = (turnoDoc?.parkinglotId ?? turnoDoc?.assignedParking ?? cajaDoc?.parkinglotId) ?? null;
  const cajaId = (turnoDoc?.cajaId ?? cajaDoc?._id) ?? null;
  const cajaCode = String(turnoDoc?.cajaCode ?? cajaDoc?.code ?? '') || '';
  const turnoIdResolved = turnoDoc?._id ?? null;
  const turnoNumeroCaja = Number((turnoDoc?.numeroCaja ?? turnoDoc?.cajaNumero ?? 0)) || null;

  return CajaMovimiento.create({
    parkinglotId,
    cajaId,
    cajaCode,
    turnoId: turnoIdResolved,
    actorUserId: input.actorUserId ?? null,
    actorRole: input.actorRole ?? 'system',
    sourceType: input.sourceType,
    sourceId: input.sourceId ?? '',
    amount: Number(input.amount ?? 0),
    paymentMethod: input.paymentMethod ?? '',
    paymentReference: input.paymentReference ?? '',
    status: input.status ?? 'registrado',
    snapshot: {
      ...(input.snapshot ?? {}),
      turnoNumeroCaja,
      cajaCode,
    } as Record<string, unknown>,
  });
}
