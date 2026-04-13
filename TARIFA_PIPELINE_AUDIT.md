# Tarifa / Cobro Pipeline Audit

## Hallazgo principal
El sistema de cobro está mezclando dos contratos de tarifa incompatibles.

## Contrato real del modelo `Tarifa`
Archivo:
- `src/models/Tarifa.ts`

Shape real detectado:
- `tarifasHora[]`
- `tarifasPorDia[]`
- `tarifaMensual[]`
- `tarifaLibre[]`
- `precioUnitario`
- `precioConDescuento`
- `precioTotal`

## Contrato esperado por el cálculo actual
Archivo:
- `src/lib/calculos/estadia.ts`

El cálculo actual espera campos legacy no presentes en el modelo actual:
- `precioHora`
- `precioDia`
- `precioLibre`
- `precioMes`
- `fraccionMin`
- `discountPercentHora`
- `discountPercentDia`
- `discountPercentMes`
- `horasDia`

## Impacto
Cuando el cálculo corre, usa `?? 0` sobre campos inexistentes y termina devolviendo:
- total = 0
- detalle con `$0`

## Otros hallazgos
### `src/app/api/caja/ingreso/route.ts`
También asume contrato viejo:
- `tarifa.tarifaHora`
- `tarifaBaseHora`

### `src/modules/caja/types/caja.types.ts`
`TarifaSnapshot` todavía refleja un contrato plano legacy.

## Conclusión
El bug no es de UI ni de turnos.
Es un desacople estructural entre:
- modelo real `Tarifa`
- lógica de cálculo `calcularTotal`
- snapshots de ticket/tarifa
- ingreso/salida

## Paso siguiente recomendado
Reescribir `src/lib/calculos/estadia.ts` para consumir el modelo real `Tarifa`:
- hora => `tarifasHora[]`
- dia => `tarifasPorDia[]`
- libre => `tarifaLibre[]`
- mensual => `tarifaMensual[]`

Y luego alinear:
- `src/app/api/caja/ingreso/route.ts`
- `src/modules/caja/types/caja.types.ts`
- snapshots/serializers si hace falta
