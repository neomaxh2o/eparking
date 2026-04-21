# Billing fix validation

## Objetivo validado
Evitar rotura en cobro/acreditación por ausencia de `adminCashTurnoId` luego del endurecimiento de endpoints.

## Evidencia de código
### Endpoints endurecidos que exigen `adminCashTurnoId`
- `src/app/api/v2/billing/documents/[invoiceId]/route.ts`
  - exige `adminCashTurnoId` cuando `estado === 'pagada'`
- `src/app/api/v2/billing/documents/[invoiceId]/acreditar/route.ts`
  - exige `adminCashTurnoId`
- También existe la misma exigencia en los endpoints `abonados/facturas/*`

### Call sites corregidos
- `src/app/components/AdminPanel/OwnerCollectionsPanel.tsx`
  - envía `adminCashTurnoId: activeTurnoId`
- `src/app/components/AdminPanel/PanelFacturacion.tsx`
  - envía `adminCashTurnoId` al marcar `pagada`
  - envía `adminCashTurnoId` al acreditar documento
- `src/modules/auditoria-cajas/components/AdminTurnoPanel.tsx`
  - ya enviaba `adminCashTurnoId` al acreditar
  - sigue enviándolo al marcar `pagada`

## Validación funcional realizada
- Se verificó por búsqueda real de referencias que los endpoints endurecidos reciben nuevamente `adminCashTurnoId` desde los paneles owner/admin impactados.
- Se agregó validación de precondición UI:
  - si no hay turno administrativo activo => error explícito antes del fetch
  - si la playa del turno activo no coincide con la seleccionada => error explícito antes del fetch
- Fuente del turno activo recuperada desde `OwnerOperationsContext.operationalSnapshot`, que ya se refresca desde `/api/v2/billing/admin-cash` en `OwnerOperationsShell.tsx`.

## Comandos/evidencia usados
- `rg -n "adminCashTurnoId" ...`
- revisión directa de:
  - `OwnerCollectionsPanel.tsx`
  - `PanelFacturacion.tsx`
  - `OwnerOperationsShell.tsx`
  - endpoints `billing/documents/*`

## Resultado
- El bloqueador por ausencia de `adminCashTurnoId` queda corregido en los flows owner/admin revisados.
- No se encontró otro call site activo dentro del alcance pedido que siga invocando estos endpoints sin el identificador requerido.

## Nota sobre validación global
- `npm run typecheck` falla a nivel repo por una gran cantidad de errores preexistentes fuera del alcance del fix.
- Esos errores no invalidan la evidencia puntual de que los call sites corregidos ya vuelven a enviar el identificador requerido.
