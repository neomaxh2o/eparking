# Tarifas / Estadías Alignment Audit

## Hallazgos

### 1. SelectorTarifas
Archivo:
- `src/app/components/Parking/Estadias/Formularios/SelectorTarifas.tsx`

Estado:
- el selector sí trabaja con el shape real de `Tarifa`
- usa `tarifasHora`, `tarifasPorDia`, `tarifaMensual`, `tarifaLibre`
- construye `SubTarifa` con `_id` del documento padre + `category`

Conclusión:
- el selector está relativamente alineado con el modelo real
- no parece ser la causa principal del `$0`

### 2. Hook de tarifas
Archivo:
- `src/app/hooks/Tarifa/useTarifa.ts`

Estado:
- obtiene `/api/tarifas`
- filtra por `parkinglotId`
- `getTarifaByCategory` busca por `category`

Riesgo:
- la UI depende de que `parkinglotId` correcto llegue a este hook
- si el parking actual no se propaga bien, la selección puede venir vacía o de otra playa

### 3. Persistencia de estadía
Archivos:
- `src/app/api/estadias/route.ts`
- `src/app/api/caja/ingreso/route.ts`
- `src/app/api/v2/caja/ingreso/route.ts`
- `src/modules/caja/server/caja.logic.ts`

Hallazgo crítico:
- el flujo V2 de ingreso NO resuelve tarifa automáticamente por `parkinglotId + category`
- solo persiste `tarifaId` si viene explícitamente en el payload
- si el frontend no manda `tarifaId`, la estadía/ticket nacen sin una tarifa canónica útil

Conclusión:
- este es probablemente el origen real del pipeline roto

### 4. API legacy de estadías
Archivo:
- `src/app/api/estadias/route.ts`

Hallazgo:
- maneja `parkinglotId`, `tarifaId`, asignación de plaza, etc.
- pero el flujo V2 de caja no está reutilizando esa lógica ni su resolución de contexto

## Decisión recomendada

### fuente de verdad para crear estadía
Al crear ingreso/caja V2, el sistema debe resolver:
- operador -> parking asignado
- categoría del vehículo
- tipo de estadía
- tarifa aplicable

Y persistir como mínimo:
- `tarifaId`
- `parkinglotId`
- snapshot mínimo de tarifa
- tipo/cantidad aplicada

## Próximo paso
Implementar resolución automática de tarifa en el flujo V2 de ingreso:
- leer `User.assignedParking`
- buscar `Tarifa` por `parkinglotId + category`
- seleccionar subtarifa según `tipoEstadia + cantidad`
- persistir `tarifaId` y snapshot en ticket/estadia
