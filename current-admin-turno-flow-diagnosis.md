# Diagnóstico del flujo actual de turno administrativo

## Situación encontrada
- La caja administrativa abría turnos en `Turno` con `esCajaAdministrativa=true`.
- El cierre previo hacía `PATCH /api/v2/billing/admin-cash` y movía el turno directo a `cerrado` sin snapshot congelado.
- La liquidación administrativa no persistía una entidad propia para reporting por turno.
- Los totales dependían de operaciones de UI/fallback y no quedaban consolidados servidor-side.
- No existía `GET /api/v2/turno/:id/liquidacion`.
- Después del cierre no quedaba una base robusta para reportes financieros históricos por turno administrativo.

## Riesgos funcionales
- Reintentos podían duplicar intentos de liquidación lógica.
- No había snapshot congelado con tickets + movimientos administrativos.
- El reporte por turno no tenía una fuente de liquidación inmutable.
- El flujo de owner/admin seguía separando “cerrar” de “liquidar”, lo que dejaba estados ambiguos.

## Corrección aplicada
- Se agregó `TurnoLiquidacion` como snapshot persistente, único por `turnoId`.
- La liquidación administrativa ahora consolida tickets y `CajaMovimiento` en backend.
- `POST /api/v2/turno/liquidar` soporta turno administrativo por `turnoId`.
- `GET /api/v2/turno/:id/liquidacion` expone el snapshot congelado.
- El turno administrativo pasa a `liquidado` con `fechaCierre`, `liquidacion` resumida y sin más operaciones.
- El panel admin/owner muestra estado abierto/liquidado, resumen previo y acción única `Cerrar / Liquidar turno`.
