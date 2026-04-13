export const API_MIGRATION_MAP = {
  parking: {
    status: 'adapted-runtime',
    legacy: '/src/app/api/parking/list/route.ts',
    target: '/src/modules/parking/lib/parking.api.ts',
    contract: '/src/shared/api/contracts/parking.ts',
  },
  plazas: {
    status: 'adapted-runtime',
    legacy: '/src/app/api/plazas/route.ts',
    target: '/src/modules/plazas/lib/plazas.api.ts',
    contract: '/src/shared/api/contracts/plazas.ts',
  },
  tickets: {
    status: 'adapted-runtime',
    legacy: '/src/app/api/caja/ticket/[id]/route.ts',
    target: '/src/modules/tickets/lib/tickets.api.ts',
    contract: '/src/shared/api/contracts/tickets.ts',
  },
  pricing: {
    status: 'pending-canonical-endpoint',
    legacy: '/src/app/api/tarifas/route.ts',
    target: '/src/modules/pricing/lib/pricing.api.ts',
    contract: '/src/shared/api/contracts/pricing.ts',
  },
  turnos: {
    status: 'v2-active',
    legacy: '/src/app/api/caja/turno/route.ts',
    target: '/src/app/api/v2/turno/route.ts',
    contract: '/src/modules/caja/types/caja.types.ts',
  },
  caja: {
    status: 'v2-active',
    legacy: '/src/app/api/caja/ingreso/route.ts',
    target: '/src/app/api/v2/caja/ingreso/route.ts',
    contract: '/src/modules/caja/types/caja.types.ts',
  },
  users: {
    status: 'stabilized-runtime',
    legacy: '/src/app/api/users/list/route.ts',
    target: '/src/app/api/users/me/route.ts',
    contract: '/src/interfaces/user.ts',
  },
  payments: {
    status: 'v2-active',
    legacy: '/src/app/components/Payments/PaymentCheckIn.tsx',
    target: '/src/app/api/v2/abonados/payments/webhook/route.ts',
    contract: '/src/shared/api/contracts/payments.ts',
  },
} as const;
