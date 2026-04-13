# Caja / Turnos — Stage Closure Audit

## Estado actual
La etapa ya tiene base V2 operativa, pero todavía conviven flujos legacy y V2.

## Hallazgos principales

### 1. Creación de Turno
Fuentes detectadas:
- `src/modules/turnos/server/turno.logic.ts` -> V2 oficial
- `src/app/api/caja/turno/abrir/route.ts` -> legacy compat
- `src/app/api/caja/salida/route.ts`
- `src/app/api/estadias/cobrar/route.ts`
- `src/app/api/estadias/habilitar/cerrar-prepago/route.ts`

Estado:
- V2 + principales creates legacy ya pasan por `ensureTurnoIdentity()`.
- Queda riesgo residual en rutas legacy que actualizan turno sin pasar por V2.

### 2. Lógica duplicada de caja/estadias
Duplicación fuerte encontrada entre:
- `src/app/api/caja/salida/route.ts`
- `src/app/api/estadias/cobrar/route.ts`
- `src/app/api/estadias/habilitar/cerrar-prepago/route.ts`

Todas:
- calculan cobro
- cierran estadía
- construyen ticket para turno
- crean/actualizan turno

Conclusión:
- esta lógica debe migrarse a `src/modules/caja/server/caja.logic.ts`
- los route handlers deben quedar solo como request/response wrappers

### 3. Flujo V2 existente
Base válida detectada:
- `src/modules/caja/services/caja.service.ts`
- `src/modules/turnos/server/turno.logic.ts`
- `src/modules/caja/server/serializers.ts`
- `src/app/api/v2/caja/*`
- `src/app/api/v2/turno/*`

Conclusión:
- V2 ya es suficientemente real para declararlo camino oficial

### 4. UI de turno
- `TurnoPanel.tsx` sigue siendo el panel legacy visible
- `TurnoPanelV2.tsx` existe pero todavía no es la vista oficial

Conclusión:
- falta decidir panel oficial y retirar ambigüedad de UI

## Decisión recomendada

### Oficial
- `src/modules/caja/*`
- `src/modules/turnos/*`
- `src/app/api/v2/*`

### Legacy transitorio
- `src/app/api/caja/*`
- `src/app/api/estadias/*`
- `src/app/hooks/Parking/Caja/*`
- `src/app/components/Parking/Estadias/*`

## Próximos pasos

### P1
Mover la lógica de cierre/cobro duplicada a `src/modules/caja/server/caja.logic.ts`.

### P2
Dejar `src/app/api/v2/*` como wrappers finos sobre `modules/caja` y `modules/turnos`.

### P3
Definir si `TurnoPanelV2.tsx` reemplaza a `TurnoPanel.tsx` o si el legacy sigue temporalmente.

### P4
Ejecutar smoke funcional completo:
- abrir turno
- ingreso
- salida
- liquidación
- cierre
- prepago
- cierre prepago
- conflicto por turno abierto
- modificación ticket / recálculo de total
