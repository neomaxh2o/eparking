# Bloque A — before / after

## Antes
- `src/app/api/v2/abonados/route.ts(145,7)`
  - `TS2322: Type 'string' is not assignable to type 'BillingFrequency | undefined'.`
- `src/app/api/estadias/route.ts(198,54)`
  - `TS2345: Argument of type 'unknown' is not assignable to parameter of type 'number | undefined'.`

## Después
- `src/app/api/v2/abonados/route.ts`
  - Se agregó `toBillingFrequency(value)` para restringir el valor a `'mensual' | 'diaria' | 'hora'` antes de enviarlo a `emitAbonadoInvoice()`.
- `src/app/api/estadias/route.ts`
  - Se agregó `toOptionalNumber(value)` para convertir `unknown` a `number | undefined` de forma segura.
  - Se usa tanto al leer `data.subplazaAsignadaNumero` en `POST` como al invocar `releaseSubplaza()` en `PUT`.

## Resultado observable
- En la rerun de `npm run typecheck`, los dos errores objetivo dejan de aparecer.
- El typecheck global sigue fallando por errores ajenos al alcance de Bloque A.
