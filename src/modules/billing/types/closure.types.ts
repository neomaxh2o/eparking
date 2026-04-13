export type BillingClosureType = 'turno' | 'caja' | 'zeta' | 'periodo';
export type BillingClosureStatus = 'open' | 'closed' | 'posted';

export interface BillingClosureSummary {
  efectivo: number;
  tarjeta: number;
  qr: number;
  otros: number;
  total: number;
  documentsCount: number;
  documentsByType: Record<string, number>;
}

export interface CloseZetaInput {
  actorRole: 'admin' | 'owner' | 'operator' | 'system';
  actorUserId?: string;
  ownerId?: string | null;
  parkinglotId?: string | null;
  cajaNumero?: number | null;
  from?: string | Date | null;
  to?: string | Date | null;
}
