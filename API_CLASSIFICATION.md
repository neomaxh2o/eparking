# API Classification — INSTALL / eParking frontend

## Scope
Clasificación inicial de `src/app/api/*` para separar frontend y backend de forma progresiva.

## Legend
- KEEP: mantener por ahora, forma parte de auth/BFF mínimo o soporte transitorio.
- ADAPT: mantener temporalmente pero detrás de contratos nuevos / modules lib.
- REWRITE: requiere rediseño serio; está demasiado acoplado o inconsistente.
- REMOVE: vacío, roto o redundante; retirar cuando exista reemplazo.

---

## KEEP

### auth
- `src/app/api/auth/[...nextauth]/route.ts`
  - Mantener como capa de autenticación del frontend mientras no exista auth externo separado.

---

## ADAPT

### parking
- `src/app/api/parking/route.ts`
  - Endpoint transitorio normalizado sobre `ParkingLot` para listado base.
- `src/app/api/parking/[id]/route.ts`
  - Endpoint transitorio PATCH normalizado sobre `ParkingLot`.
- `src/app/api/parking/create/route.ts`
  - Útil como endpoint transitorio para `createParking()`.
- `src/app/api/parking/all/route.ts`
  - Endpoint transitorio normalizado para listado completo con owner.
- `src/app/api/parking/list/route.ts`
  - Endpoint transitorio normalizado para listado por rol/session.
- `src/app/api/plazas/route.ts`
- `src/app/api/plazas/[id]/route.ts`
- `src/app/api/tarifas/route.ts`
- `src/app/api/tarifas/[id]/route.ts`
- `src/app/api/tarifas/unificado/route.ts`
- `src/app/api/users/register/route.ts`

Motivo:
- siguen siendo útiles para operar el frontend actual
- pero están acoplados a mongoose/modelos internos
- deben quedar detrás de `shared/api/contracts` y `modules/*/lib`

---

## REWRITE

### parking core conflictivo
- `src/app/api/parking/novedades/route.ts`
- `src/app/api/parking/tarifas/route.ts`
- `src/app/api/parking/update-availability/route.ts`
- `src/app/api/parking/closest-parking/route.ts`

### caja / estadias / subscriptions
- `src/app/api/caja/*`
- `src/app/api/estadias/*`
- `src/app/api/estadias2/*`
- `src/app/api/subscriptions/route.ts`

Motivo:
- dominio complejo
- fuerte acoplamiento a modelos internos
- probable deuda alta de lint/types/contratos
- no deben ser el primer frente de estabilización

---

## REMOVE

### endpoint legado desactivado
- `src/app/api/users/login/route.ts`
  - reemplazado por endpoint explícitamente deprecated (`410 Gone`)

Motivo:
- no debe competir con `auth/[...nextauth]`
- no aporta valor como login alternativo
- se mantiene solo como señal explícita de retiro hasta borrar definitivamente

---

## Immediate rule
A partir de ahora, el frontend core debe consumir:
- `src/shared/api/contracts/*`
- `src/shared/api/client.ts`
- `src/modules/*/lib/*.api.ts`

Y debe evitar consumir directamente:
- `src/app/api/*` desde componentes UI
- modelos mongoose
- hooks legacy de `src/app/hooks/*`
