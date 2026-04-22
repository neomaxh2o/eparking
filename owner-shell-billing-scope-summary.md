# Owner shell billing scope update

## Cambios
- `OwnerCollectionsPanel` ahora consulta `GET /api/v2/billing/documents?parkinglotId=<selectedParkingId>` como contrato principal.
- Se dejó el filtro local por `assignedParking` solo como defensa adicional.
- `PanelFacturacion` quedó alineado al mismo `selectedParkingId` del owner shell para documentos, cierres y perfil fiscal.
- Al cambiar la playa activa se limpian estados visuales locales (`caja`, fechas de cierre, detalle seleccionado, mensajes/perfil`) para evitar arrastre entre playas.
- Se ajustaron labels para dejar explícito que la vista trabaja sobre la playa activa.

## Validación
- `npm run typecheck` sigue fallando por errores preexistentes y ajenos al alcance en múltiples áreas del repo.
