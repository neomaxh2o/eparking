# Branch cleanup summary

## Alcance ejecutado
- Precheck obligatorio ejecutado en el host objetivo antes de cambios:
  - `/usr/bin/whoami`
  - `/usr/bin/hostname`
  - `/usr/bin/which docker`
  - `/usr/bin/docker ps`
- Trabajo restringido al repo `/root/.openclaw/workspace-bitron/eparking` sobre `feature/owner-operations-refactor`.
- Eliminados del PR artefactos internos no producto.
- Revertidos fuera del PR endpoints no referenciados/no necesarios para el fix solicitado.
- Restaurado el envío de `adminCashTurnoId` en flujos owner/admin impactados por endpoints endurecidos.
- Normalizada la lógica efectiva de estado de turno (`abierto`/`ABIERTO`/`en_curso`) en adapters y panel de auditoría.

## Fixes aplicados
### 1) OwnerCollectionsPanel
- Ahora consume `OwnerOperationsContext`.
- Usa `operationalSnapshot.activeTurnoId` como `adminCashTurnoId` al acreditar.
- Valida mismatch de playa entre turno activo y playa seleccionada antes de enviar.

### 2) PanelFacturacion
- Recuperado `adminCashTurnoId` desde `ownerOperations.operationalSnapshot.activeTurnoId`.
- Se adjunta `adminCashTurnoId` en:
  - `PATCH /api/v2/billing/documents/[invoiceId]` cuando `estado === 'pagada'`
  - `POST /api/v2/billing/documents/[invoiceId]/acreditar`
- Se bloquea la acción con error claro si no hay turno administrativo activo o si la playa activa no coincide.

### 3) Normalización de estado de turno
- `src/modules/turnos/adapters/turno.adapter.ts`: canonicaliza a minúsculas (`abierto`, `cerrado`, `liquidado`, `pendiente_liquidacion`), absorbiendo `en_curso` como `abierto`.
- `src/modules/turnos/adapters/turnoViewModel.adapter.ts`: checks case-insensitive en estado.
- `src/modules/auditoria-cajas/hooks/useAuditoriaCajas.ts`: fallback y bandera `turnoAbiertoNormalized` ahora usan estado normalizado en minúsculas.
- `src/modules/auditoria-cajas/components/AdminTurnoPanel.tsx`: render y acciones usan helper normalizado, sin depender de `ABIERTO` vs `abierto`.

## Decisión sobre rutas discutidas
- `src/app/api/v2/facturacion/estado-abonado/route.ts` => sale del PR.
- `src/app/api/v2/facturacion/pagar/route.ts` => sale del PR.
- `src/app/api/v2/billing/test/charge/route.ts` => se mantiene, pero se revierte el cambio de este branch para que no agregue ruido funcional al PR.

## Motivo
- Las dos rutas `facturacion/*` no tienen referencias activas en `src/` y no son necesarias para resolver el bloqueo funcional pedido.
- `billing/test/charge` sí es referenciada por `FinancialOperationsMock`, pero el cambio del branch era solo typing/cleanup incidental; no aporta al fix pedido.
