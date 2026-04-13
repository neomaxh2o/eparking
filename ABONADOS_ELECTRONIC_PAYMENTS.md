# ABONADOS_ELECTRONIC_PAYMENTS

## Base interna implementada

### Acreditación directa por factura
`POST /api/v2/abonados/facturas/[invoiceId]/acreditar`

Body opcional:
```json
{
  "paymentProvider": "electronic",
  "paymentReference": "REF-123",
  "paymentMethod": "electronic"
}
```

### Conciliación por referencia de pago
`POST /api/v2/abonados/payments/reconcile`

Body:
```json
{
  "paymentReference": "REF-123",
  "paymentProvider": "gateway-name",
  "paymentMethod": "electronic"
}
```

## Efecto esperado
- factura -> pagada
- fechaPago -> now
- acreditadoAutomaticamente -> true
- abonado suspendido/vencido -> activo si no quedan vencidas

## Próxima fase
Conectar webhook real de pasarela/PSP para llamar conciliación por referencia.
