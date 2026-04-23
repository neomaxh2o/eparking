# Bloque B — chequeo de ruido/generated en `.next/types`

## Comparativo `origin/main...feature/owner-operations-refactor`
- Base main: `495c00bc486bc6c910378764fcdfbbecd92d9da4`
- Head feature local al momento del chequeo: `8c209e94c2339c908c7cf20826a2f36b18e2f8a4`
- `git diff --name-only origin/main...HEAD -- .next/types` => **sin archivos versionados en `.next/types` dentro del compare**.

## Clasificación explícita
### 1. `.next/types/*` en la salida de `tsc`
- Persisten múltiples errores bajo `.next/types/*` y `.next/types/validator.ts`.
- Como no aparecen en el compare versionado y pertenecen a salida generada de Next, se clasifican como **ruido/generated**.
- Ejemplos observados:
  - incompatibilidades `RouteContext` / `params: Promise<...>`
  - imports faltantes hacia rutas/app pages inexistentes o movidas
  - validaciones derivadas sobre handlers no conformes con App Router

### 2. Fuente subyacente asociada
- Parte de ese ruido/generated refleja **deuda real separada no bloqueadora para este Bloque A/B**, porque el generador está amplificando problemas ya presentes en archivos fuente fuera de alcance.
- Ejemplos visibles en la misma corrida:
  - `src/app/abonados/dashboard/page.tsx`
  - `src/app/api/caja/turno/eventos/route.ts`
  - `src/app/api/estadias/visualizacion/route.ts`
  - `src/app/api/health/_helpers.ts`
  - `src/app/api/parking/create/route.ts`
  - y muchos otros

## Conclusión
- **No hay residuos versionados en `.next/types` dentro del compare main vs feature.**
- **Sí hay ruido/generated en `.next/types` durante typecheck.**
- Ese ruido no es el bloqueador principal por sí solo; hoy convive con **deuda fuente separada** todavía abierta fuera del alcance ejecutado.
