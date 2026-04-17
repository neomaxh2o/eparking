# admin-cash request/response

## POST /api/v2/billing/admin-cash

### Request
```http
POST /api/v2/billing/admin-cash
Content-Type: application/json

{
  "parkinglotId": "68014f0f4b9b4c001234abcd",
  "cajaNumero": 1,
  "esCajaAdministrativa": true
}
```

### Response esperada
```json
{
  "ok": true,
  "turno": {
    "_id": "68014f7b4b9b4c001234abce",
    "operatorId": "...",
    "parkinglotId": "68014f0f4b9b4c001234abcd",
    "assignedParking": "68014f0f4b9b4c001234abcd",
    "numeroCaja": 1,
    "cajaNumero": 1,
    "estado": "abierto",
    "esCajaAdministrativa": true,
    "fechaApertura": "2026-04-17T19:35:00.000Z"
  }
}
```

## GET /api/v2/billing/admin-cash?parkinglotId=...

### Response con turno abierto
```json
{
  "turno": {
    "_id": "68014f7b4b9b4c001234abce",
    "parkinglotId": "68014f0f4b9b4c001234abcd",
    "assignedParking": "68014f0f4b9b4c001234abcd",
    "estado": "abierto"
  }
}
```

### Response luego del cierre
```json
{
  "turno": null
}
```

## PATCH /api/v2/billing/admin-cash

### Request
```http
PATCH /api/v2/billing/admin-cash
Content-Type: application/json

{
  "turnoId": "68014f7b4b9b4c001234abce",
  "action": "close"
}
```

### Response esperada
```json
{
  "ok": true,
  "turno": {
    "_id": "68014f7b4b9b4c001234abce",
    "parkinglotId": "68014f0f4b9b4c001234abcd",
    "assignedParking": "68014f0f4b9b4c001234abcd",
    "estado": "cerrado",
    "fechaCierre": "2026-04-17T19:50:00.000Z"
  }
}
```

## Nota del fix
- POST ahora persiste **ambos campos** (`parkinglotId` y `assignedParking`) con el mismo valor.
- GET filtrado busca por cualquiera de los dos campos para cubrir documentos viejos y nuevos.
- El adapter cliente vuelve a exponer esos campos, evitando que el shell state-driven interprete el turno como ajeno a la playa seleccionada.
