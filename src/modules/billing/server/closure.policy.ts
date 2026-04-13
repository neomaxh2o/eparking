import type { BillingActorRole } from '@/modules/billing/types/billing.types';

export function canRunZetaClosure(actorRole: BillingActorRole) {
  return actorRole === 'admin' || actorRole === 'owner';
}

export function assertCanRunZetaClosure(actorRole: BillingActorRole) {
  if (!canRunZetaClosure(actorRole)) {
    throw new Error('No autorizado para ejecutar cierre Z.');
  }
}
