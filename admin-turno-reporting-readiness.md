# Reporting readiness - turno administrativo liquidado

## Qué queda listo para reportes por turno
- Snapshot inmutable por `turnoId` en `TurnoLiquidacion`.
- Totales consolidados por medio de pago:
  - efectivo
  - transferencia
  - tarjeta
  - otros
- Totales financieros agregados:
  - ingresos
  - egresos
  - saldo teórico
  - diferencia de caja
- Conteos operativos:
  - cantidad de tickets
  - cantidad de operaciones
- Trazabilidad:
  - operador de apertura
  - operador de cierre/liquidación
  - rango temporal apertura/cierre
  - parking/caja cuando aplica
- Snapshot de detalle:
  - tickets incluidos
  - movimientos administrativos incluidos

## Uso sugerido para reporting
- Reportes históricos por turno pueden leer directo de `TurnoLiquidacion` sin recalcular.
- Reportes operativos en vivo pueden seguir leyendo `Turno`, pero reportes cerrados deberían priorizar la liquidación congelada.
- La clave única por `turnoId` evita dobles cierres y mejora consistencia contable.

## Pendientes recomendados a futuro
- Vincular PDFs/HTML de reporte histórico directamente al snapshot de liquidación.
- Agregar filtros agregados por parking, caja, owner y rango de fechas sobre `TurnoLiquidacion`.
- Incluir egresos explícitos en UI si el negocio empieza a registrarlos de forma diferenciada.
