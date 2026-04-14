import type { AbonadoDoc } from '@/lib/types/documents';

export function toClientAbonado(doc: unknown): AbonadoDoc {
  const d = (doc && typeof doc === 'object') ? (doc as Record<string, unknown>) : {};
  return {
    _id: String(d._id ?? ''),
    nombre: typeof d.nombre === 'string' ? d.nombre : undefined,
    apellido: typeof d.apellido === 'string' ? d.apellido : undefined,
    dni: typeof d.dni === 'string' ? d.dni : undefined,
    telefono: typeof d.telefono === 'string' ? d.telefono : undefined,
    email: typeof d.email === 'string' ? d.email : undefined,
    assignedParking: d.assignedParking ?? null,
    numeroAbonado: typeof d.numeroAbonado === 'number' ? d.numeroAbonado : undefined,
    vehiculos: Array.isArray(d.vehiculos) ? (d.vehiculos as any[]) : undefined,
    ...d,
  } as AbonadoDoc;
}
