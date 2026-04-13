# MERCADOPAGO_ABONADOS_INTEGRATION

## Provider objetivo
`mercadopago`

## Formato recomendado de referencia
`ABO:<invoiceId>`

Alternativa extendida:
`ABO:<abonadoId>:<periodoLabel>:<invoiceId>`

## Campos esperados del evento externo
- `external_reference`
- `status`
- `payment_type_id`
- `id`

## Mapping propuesto
- `external_reference` -> `paymentReference`
- `status` -> `externalStatus`
- `payment_type_id` -> `paymentMethod`
- provider fijo -> `mercadopago`

## Estados que acreditan
- approved
- accredited

## Variables futuras
- `MERCADOPAGO_ACCESS_TOKEN`
- `ABONADOS_PAYMENT_WEBHOOK_SECRET`
- `MERCADOPAGO_WEBHOOK_URL`

## Flujo esperado
1. crear factura abonado
2. generar referencia `ABO:<invoiceId>`
3. usar esa referencia en Mercado Pago
4. webhook Mercado Pago -> `/api/v2/abonados/payments/webhook`
5. conciliar y acreditar automáticamente
