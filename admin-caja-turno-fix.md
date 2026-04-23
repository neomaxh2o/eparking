# Admin caja/turno fix

## Archivo modificado
- `src/app/components/AdminPanel/PanelFlujoOperativo.tsx`

## Cambios aplicados
### 1. Se reemplazó el cierre roto por liquidación real
Antes:
- la UI usaba `PATCH /api/v2/billing/admin-cash` para cerrar
- eso quedó incompatible con el backend vigente

Ahora:
- el botón operativo usa `POST /api/v2/turno/liquidar`
- el body envía `turnoId` + observación operativa
- el cierre queda alineado con la liquidación server-side validada

### 2. Se restauró el ciclo visible de jornada
La UI ahora distingue con claridad:
- sin turno abierto
- turno abierto / operable
- turno liquidado / cerrado

Se agregaron affordances explícitas:
- `Abrir caja/turno`
- `Liquidar y cerrar`
- mensaje de reapertura posterior en la misma playa

### 3. Se preservó la operatoria con documentos bajo turno activo
En la vista `Documentos de playa`:
- acreditar sigue exigiendo `adminCashTurnoId`
- marcar `pagada` también exige turno activo
- sin turno abierto, la vista queda consultiva y muestra el bloqueo funcional

Esto evita romper:
- acreditación ligada a `adminCashTurnoId`
- trazabilidad por turno administrativo
- scoping operativo por playa

### 4. Se agregó visibilidad inmediata post-liquidación
Después de liquidar, la UI conserva en memoria local del panel:
- último turno cerrado
- snapshot de liquidación devuelto por backend

Se muestran:
- turno
- caja
- apertura/cierre
- tickets
- operaciones
- efectivo / transferencia / tarjeta / otros
- saldo teórico
- diferencia

Con eso el usuario ve que el cierre fue exitoso y que puede reabrir.

## Qué no se tocó
- backend
- contratos API
- cálculo server-side de liquidación
- persistencia `TurnoLiquidacion`
- auth/authz
- billing por `parkinglotId`
- gating fiscal de cierres

## Validación realizada
### ESLint puntual del archivo modificado
Ejecutado:
- `npx eslint src/app/components/AdminPanel/PanelFlujoOperativo.tsx`

Resultado:
- sin errores reportados en el archivo luego del ajuste

### Typecheck global
Ejecutado:
- `npx tsc --noEmit`

Resultado:
- falla por gran cantidad de errores preexistentes en otras áreas del repo
- no bloquea la trazabilidad del fix aplicado porque no corresponden al flujo tocado

## Comportamiento esperado tras el fix
1. Elegir playa y caja
2. Abrir caja/turno
3. Operar documentos con turno activo
4. Liquidar/cerrar usando el endpoint correcto
5. Ver resumen de liquidación
6. Volver a abrir otro turno en la misma playa si ya no existe uno abierto
