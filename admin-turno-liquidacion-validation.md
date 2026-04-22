# Validación de liquidación de turno administrativo

## Reglas cubiertas
- No liquidar turno inexistente: `404` si el turno no existe.
- No liquidar turno ya liquidado: devuelve `409` o respuesta idempotente con snapshot existente.
- No duplicar liquidación en retry: `TurnoLiquidacion` usa índice único por `turnoId` + `upsert`.
- No nuevas operaciones después de liquidado: las rutas operativas exigen `estado='abierto'`; el panel también bloquea acciones.
- Totales calculados backend-only: la consolidación se hace en `buildAdminTurnoLiquidacion()` usando tickets + `CajaMovimiento`.
- Persistencia de snapshot congelado: se guarda `snapshot` completo en `TurnoLiquidacion`.

## Campos mínimos persistidos
- `turnoId`
- `cajaId` (si existe)
- `cajaNumero`
- `operadorAperturaId`
- `operadorCierreId`
- `liquidadoPor`
- `fechaApertura`
- `fechaCierre`
- `cantidadTickets`
- `cantidadOperaciones`
- `totalEfectivo`
- `totalTransferencia`
- `totalTarjeta`
- `totalOtros`
- `totalIngresos`
- `totalEgresos`
- `saldoTeorico`
- `saldoDeclarado`
- `diferenciaCaja`
- `observaciones`
- `createdAt` / `updatedAt`

## Endpoints validados
- `POST /api/v2/turno/liquidar`
- `GET /api/v2/turno/:id/liquidacion`
- `PATCH /api/v2/billing/admin-cash` ahora rechaza cierre manual y fuerza liquidación integral.
