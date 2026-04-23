# Admin caja/turno regression analysis

## Contexto
Proyecto: `/root/.openclaw/workspace-bitron/eparking`

Objetivo del fix: restaurar desde la UI activa del admin el ciclo completo de caja/turno administrativo:
- abrir turno/caja
- operar cobranzas/acreditaciones ligadas al turno
- liquidar/cerrar correctamente
- permitir reapertura posterior en la misma playa

## Hallazgo principal
La UI activa del admin era `src/app/components/AdminPanel/PanelFlujoOperativo.tsx`.

Después del refactor convivían varias implementaciones del flujo administrativo:
- `PanelFlujoOperativo.tsx` → UI realmente montada en `/parking/admin`
- `OwnerOperationsShell.tsx` / `PreOperativeView.tsx` → shell alternativo no conectado a la página activa
- `AdminTurnoPanel.tsx` → componente más cercano al flujo correcto, pero tampoco conectado a la UI activa

El bug funcional crítico estaba en que la pantalla activa quedó desalineada del contrato operativo vigente del backend.

## Regression detectada
### 1. Cierre roto por endpoint incorrecto
La UI activa intentaba “cerrar caja” con:
- `PATCH /api/v2/billing/admin-cash`
- body sin `action=liquidar`

Pero el backend validado ya no permite cierre manual simple:
- `PATCH /api/v2/billing/admin-cash` rechaza el cierre manual
- el cierre administrativo correcto ahora es `POST /api/v2/turno/liquidar`
- ese endpoint persiste `TurnoLiquidacion` y congela snapshot server-side

Resultado: el usuario podía abrir turno pero no completar el ciclo desde la UI activa.

### 2. Falta de affordance explícita de liquidación/cierre
La pantalla mostraba botones `Abrir caja` / `Cerrar caja`, pero no expresaba que:
- el cierre válido es una liquidación integral
- luego del cierre el turno queda no operable
- la reapertura posterior debe hacerse abriendo un nuevo turno

### 3. Estado post-cierre invisible
Una vez liquidado el turno, la UI activa no mostraba resumen útil de cierre/liquidación.
Eso dejaba la sensación de “desapareció el turno” en vez de “quedó cerrado correctamente y ya podés reabrir”.

### 4. Gating operativo incompleto en documentos
La vista de documentos dependía de `adminCashTurno` para acreditar, pero el affordance no era suficientemente claro para:
- bloquear marcar pagada sin turno activo
- explicar por qué ciertas acciones requieren turno abierto
- mantener la vinculación con `adminCashTurnoId`

## Restricciones verificadas
No se tocaron contratos backend ni lógica server-side validada.
Se respetó:
- liquidación server-side vía `POST /api/v2/turno/liquidar`
- snapshot `TurnoLiquidacion`
- auth/authz existentes
- scoping por `parkinglotId`
- acreditación con `adminCashTurnoId`
- gating fiscal, que sigue residiendo en paneles de facturación/cierres y no en este flujo operativo

## Estrategia elegida
En lugar de mover la app a otro shell no montado, se corrigió la UI realmente activa:
- `src/app/components/AdminPanel/PanelFlujoOperativo.tsx`

Motivo:
- minimiza superficie de cambio
- evita introducir un nuevo flujo paralelo
- restaura el ciclo completo exactamente donde hoy opera el usuario

## Resultado esperado del fix
Desde `/parking/admin` → `Flujo Operativo` ahora debe poder:
1. seleccionar playa y caja
2. abrir caja/turno administrativo
3. operar cobranzas/acreditaciones con turno activo
4. liquidar/cerrar el turno por la ruta correcta
5. ver resumen inmediato de liquidación/cierre
6. reabrir un nuevo turno en la misma playa cuando corresponda
