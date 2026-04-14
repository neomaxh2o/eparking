import type { CajaDoc } from '@/lib/types/documents';

export function toClientCaja(doc: unknown): CajaDoc {
  const d = (doc && typeof doc === 'object') ? (doc as Record<string, unknown>) : {};
  return {
    _id: String(d._id ?? ''),
    code: typeof d.code === 'string' ? d.code : undefined,
    numero: typeof d.numero === 'number' ? d.numero : undefined,
    parkinglotId: typeof d.parkinglotId === 'string' ? d.parkinglotId : undefined,
    ...d,
  } as CajaDoc;
}
