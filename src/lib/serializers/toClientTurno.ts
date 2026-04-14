import type { TurnoDoc } from '@/lib/types/documents';

export function toClientTurno(doc: unknown): TurnoDoc {
  const d = (doc && typeof doc === 'object') ? (doc as Record<string, unknown>) : {};
  return {
    _id: String(d._id ?? ''),
    parkinglotId: typeof d.parkinglotId === 'string' ? d.parkinglotId : (d.assignedParking && typeof d.assignedParking === 'string' ? d.assignedParking : undefined),
    assignedParking: d.assignedParking ?? undefined,
    cajaId: typeof d.cajaId === 'string' ? d.cajaId : undefined,
    cajaCode: typeof d.cajaCode === 'string' ? d.cajaCode : undefined,
    numeroCaja: typeof d.numeroCaja === 'number' ? d.numeroCaja : (typeof d.cajaNumero === 'number' ? d.cajaNumero : d.numeroCaja),
    codigoTurno: typeof d.codigoTurno === 'string' ? d.codigoTurno : undefined,
    numeroTurno: typeof d.numeroTurno === 'number' ? d.numeroTurno : undefined,
    estado: typeof d.estado === 'string' ? d.estado : undefined,
    fechaApertura: d.fechaApertura ?? undefined,
    fechaCierre: d.fechaCierre ?? undefined,
    ...d,
  } as TurnoDoc;
}
