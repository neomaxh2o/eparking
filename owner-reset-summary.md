# Owner reset summary

- Owner email: owner@eparking.com
- Owner ID: 69e106bf9592f4d75f2414ea
- Timestamp (UTC): 2026-04-22T15:53:34.086Z

## Deleted documents by collection

- abonadoinvoices: 0
- abonados: 0
- users: 0

## Deleted target IDs

- abonadoinvoice: 69e3f719140fca5218dfa677
- abonado: 69e3f719140fca5218dfa672
- client user: 69e3f595140fca5218dfa5c5 (cliente@eparking.com)

## Post-delete validation

- ownerStillExists: true
- parkingsStillExist: 2
- targetInvoiceZero: 0
- targetAbonadoZero: 0
- targetUserZero: 0
- remainingReferences: `{"69e3f719140fca5218dfa677":{},"69e3f719140fca5218dfa672":{},"69e3f595140fca5218dfa5c5":{}}`

## Minimal functional post-reset test

- createdClientId: 69e8eefeeec83deaa36525cb
- createdClientEmail: cliente.reset.1776873213981@eparking.com
- createdAbonadoId: 69e8eefeeec83deaa36525cc
- createdInvoiceId: 69e8eefeeec83deaa36525cd
- targetParking: Parking Center  (69e39c05948dbbe707e255b8)
- comparisonParking: Parking Sta Rosa Sucre (69e3cc8cda4c8d9e1184d494)
- assignedParkingMatches: true
- invoiceVisibleInTargetParking: true
- invoiceReplicatedToOtherParking: false
- invoiceVisibleOwnerWide: true
- invoiceSnapshotParkingMatches: true
- tarifaId: 69e39c22948dbbe707e255c9
- amount: 140000

## Raw summary JSON

```json
{
  "ownerEmail": "owner@eparking.com",
  "ownerId": "69e106bf9592f4d75f2414ea",
  "timestamp": "2026-04-22T15:53:34.086Z",
  "deletedByCollection": {
    "abonadoinvoices": 0,
    "abonados": 0,
    "users": 0
  },
  "deletedIds": {
    "abonadoInvoiceId": "69e3f719140fca5218dfa677",
    "abonadoId": "69e3f719140fca5218dfa672",
    "clientUserId": "69e3f595140fca5218dfa5c5",
    "clientEmail": "cliente@eparking.com"
  },
  "preDeleteFound": {
    "abonadoInvoice": false,
    "abonado": false,
    "clientUser": false
  },
  "postDeleteValidation": {
    "ownerStillExists": true,
    "parkingsStillExist": 2,
    "targetInvoiceZero": 0,
    "targetAbonadoZero": 0,
    "targetUserZero": 0,
    "remainingReferences": {
      "69e3f719140fca5218dfa677": {},
      "69e3f719140fca5218dfa672": {},
      "69e3f595140fca5218dfa5c5": {}
    }
  },
  "minimalFunctionalTest": {
    "createdClientId": "69e8eefeeec83deaa36525cb",
    "createdAbonadoId": "69e8eefeeec83deaa36525cc",
    "createdInvoiceId": "69e8eefeeec83deaa36525cd",
    "createdClientEmail": "cliente.reset.1776873213981@eparking.com",
    "targetParkingId": "69e39c05948dbbe707e255b8",
    "targetParkingName": "Parking Center ",
    "comparisonParkingId": "69e3cc8cda4c8d9e1184d494",
    "comparisonParkingName": "Parking Sta Rosa Sucre",
    "assignedParkingMatches": true,
    "invoiceVisibleInTargetParking": true,
    "invoiceReplicatedToOtherParking": false,
    "invoiceVisibleOwnerWide": true,
    "invoiceSnapshotParkingMatches": true,
    "amount": 140000,
    "tarifaId": "69e39c22948dbbe707e255c9"
  }
}
```
