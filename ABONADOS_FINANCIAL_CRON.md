# ABONADOS_FINANCIAL_CRON

## Objetivo
Ejecutar control financiero automático de abonados para:
- marcar facturas vencidas
- detectar morosos
- suspender abonados con deuda vencida

## Endpoint
`POST /api/v2/abonados/financial/run`

## Recomendación de frecuencia
- cada 6 horas para entorno operativo estándar
- una vez por la madrugada si se quiere menor agresividad

## Payload esperado
Sin body.

## Resultado esperado
JSON con:
- timestamp
- invoicesChecked
- invoicesMarkedOverdue
- abonadosChecked
- abonadosSuspended

## Próxima fase
Integrar acreditación automática de pagos electrónicos para reactivar y acreditar facturas pagadas.
