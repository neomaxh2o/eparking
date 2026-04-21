# Turno status normalization

## Problema
Había mezcla efectiva entre `ABIERTO`, `abierto` y `en_curso` en adapters y render/actions del panel administrativo. Eso podía dejar el badge en un estado y los botones en otro.

## Ajuste aplicado
### Canonical interno
Se adoptó canonical en minúsculas para datos adaptados:
- `abierto`
- `cerrado`
- `liquidado`
- `pendiente_liquidacion`

`en_curso` se absorbe como `abierto` para lógica operativa.

### Archivos tocados
- `src/modules/turnos/adapters/turno.adapter.ts`
- `src/modules/turnos/adapters/turnoViewModel.adapter.ts`
- `src/modules/auditoria-cajas/hooks/useAuditoriaCajas.ts`
- `src/modules/auditoria-cajas/components/AdminTurnoPanel.tsx`
- `src/modules/caja/types/caja.types.ts` (campos opcionales agregados al tipo para acompañar el adapter)

## Validación real
Búsqueda focalizada posterior:
- `rg -n "ABIERTO|abierto|en_curso" src/modules/auditoria-cajas src/modules/turnos/adapters ...`

Resultado relevante:
- lógica de apertura en adapters/view model usa comparaciones normalizadas
- `AdminTurnoPanel.tsx` usa `turnoAbierto` derivado de estado normalizado y ya no depende de una sola variante literal
- fallback de auditoría también normaliza a minúsculas

## Efecto práctico
- badge y acciones del turno administrativo quedan alineados
- no queda dependencia funcional crítica de `ABIERTO` vs `abierto` en los archivos revisados
