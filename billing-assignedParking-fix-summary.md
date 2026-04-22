# Billing assignedParking scope fix

## Scope applied
Closed-scope fix for billed-amount replication across playa-scoped subscription/admin billing views.

Files touched:
- `src/app/api/v2/billing/documents/route.ts`
- `src/app/api/v2/abonados/facturas/route.ts`
- `src/modules/billing/server/billing.reads.ts`
- `src/app/components/AdminPanel/PanelFacturacion.tsx`

## Fix applied

### Backend
- Added support for `parkinglotId` query param in both billing document list routes.
- When `parkinglotId` is present, routes now query by `assignedParking`.
- Kept existing owner-wide compatibility when `parkinglotId` is absent.
- Added query normalization in `billing.reads.ts` so `assignedParking` is cast to `ObjectId` when valid, preventing string/ObjectId mismatch issues.
- Normalized `assignedParking`, `ownerId`, and `operatorId` to strings in billing document payloads for safer frontend comparisons.

### Frontend
- `PanelFacturacion` now requests billing documents with `parkinglotId` whenever the admin view is scoped to a selected playa.
- `PanelFacturacion` also defensively filters document KPIs/listing by `assignedParking`, avoiding cross-playa totals even if mixed data were returned.
- No owner-global restriction was added when no playa is selected: totals remain owner-wide in that case.

## Final criteria covered
- Billing ownership remains tied to `AbonadoInvoice.assignedParking`.
- Playa-scoped billing views summarize only documents belonging to the selected `assignedParking`.
- Global owner views remain global only when no `parkinglotId` is supplied.
- `AdminTurnoPanel` continues consuming `/api/v2/billing/documents?parkinglotId=...` and does not need an additional local total recomputation fix.

## Validation performed
- Reviewed git diff only for scoped files.
- Ran `git diff --check` on scoped files after edits.
