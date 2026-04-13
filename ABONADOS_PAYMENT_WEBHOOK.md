# ABONADOS_PAYMENT_WEBHOOK

## Endpoint
`POST /api/v2/abonados/payments/webhook`

## Seguridad
Header opcional:
`x-abonados-webhook-secret: <ABONADOS_PAYMENT_WEBHOOK_SECRET>`

Si `ABONADOS_PAYMENT_WEBHOOK_SECRET` está definido en env, el header es obligatorio.

## Payload estándar aceptado
```json
{
  "paymentReference": "REF-123",
  "paymentProvider": "mercadopago",
  "paymentMethod": "electronic",
  "externalStatus": "paid",
  "raw": {}
}
```

Aliases soportados:
- `reference`
- `provider`
- `method`
- `status`

## Estados externos que acreditan
- paid
- approved
- accredited
- success
- succeeded

## Efecto
- busca facturas por `paymentReference`
- si el estado externo acredita -> factura pagada
- guarda `externalStatus` y `externalPayload`
- reactiva abonado si no quedan vencidas
