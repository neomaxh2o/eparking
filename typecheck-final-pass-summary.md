# Typecheck Final Pass Summary

- Branch: feature/owner-operations-refactor
- HEAD (pre-commit if pending): 25bc9738d866e51eabb7d61a305322e7b3d12e97
- Files changed vs origin/main: 75
- Remaining branch-attributable source errors (all changed files): 8
- Remaining branch-attributable source errors (targeted 5 files): 0
- Remaining .next/types errors (global): 36
- Remaining .next/types errors (targeted 3 route handlers): 0

## Remaining branch-attributable source errors (all changed files)
- src/modules/caja/server/caja.logic.ts:131:7 TS2353 Object literal may only specify known properties, and 'tipoEstadiaAplicada' does not exist in type '{ _id?: string | undefined; nombre?: string | undefined; tarifaHora?: number | undefined; tarifaDia?: number | undefined; tarifaLibre?: number | undefined; tarifaBaseHora?: number | undefined; fraccionMinutos?: number | undefined; }'.
- src/modules/caja/server/caja.logic.ts:151:7 TS2353 Object literal may only specify known properties, and 'tipoEstadiaAplicada' does not exist in type '{ _id?: string | undefined; nombre?: string | undefined; tarifaHora?: number | undefined; tarifaDia?: number | undefined; tarifaLibre?: number | undefined; tarifaBaseHora?: number | undefined; fraccionMinutos?: number | undefined; }'.
- src/modules/caja/server/caja.logic.ts:165:7 TS2353 Object literal may only specify known properties, and 'tipoEstadiaAplicada' does not exist in type '{ _id?: string | undefined; nombre?: string | undefined; tarifaHora?: number | undefined; tarifaDia?: number | undefined; tarifaLibre?: number | undefined; tarifaBaseHora?: number | undefined; fraccionMinutos?: number | undefined; }'.
- src/modules/caja/server/caja.logic.ts:172:44 TS2339 Property 'cantidadAplicada' does not exist on type '{ _id?: string | undefined; nombre?: string | undefined; tarifaHora?: number | undefined; tarifaDia?: number | undefined; tarifaLibre?: number | undefined; tarifaBaseHora?: number | undefined; fraccionMinutos?: number | undefined; }'.
- src/modules/caja/server/caja.logic.ts:176:30 TS2339 Property 'precioTotalAplicado' does not exist on type '{ _id?: string | undefined; nombre?: string | undefined; tarifaHora?: number | undefined; tarifaDia?: number | undefined; tarifaLibre?: number | undefined; tarifaBaseHora?: number | undefined; fraccionMinutos?: number | undefined; }'.
- src/modules/caja/server/caja.logic.ts:182:5 TS2322 Type '{ _id?: string | undefined; nombre?: string | undefined; tarifaHora?: number | undefined; tarifaDia?: number | undefined; tarifaLibre?: number | undefined; tarifaBaseHora?: number | undefined; fraccionMinutos?: number | undefined; } | undefined' is not assignable to type 'TarifaSnapshotLike | undefined'.
- src/modules/turnos/components/TurnoPanelV2.tsx:33:9 TS2741 Property 'observacion' is missing in type '{ efectivo: number; tarjeta: number; otros: number; }' but required in type 'LiquidacionInputs'.
- src/modules/turnos/components/TurnoPanelV2.tsx:65:57 TS2345 Argument of type 'TurnoData | null' is not assignable to parameter of type 'TurnoCaja | null'.

## Remaining .next/types errors (global)
- .next/types/app/api/auth/[...nextauth]/route.ts:12:13 TS2344 Type 'OmitWithTag<typeof import("/root/.openclaw/workspace-bitron/eparking/src/app/api/auth/[...nextauth]/route"), "config" | "GET" | "DELETE" | "POST" | "PATCH" | "PUT" | "generateStaticParams" | ... 8 more ... | "OPTIONS", "">' does not satisfy the constraint '{ [x: string]: never; }'.
- .next/types/app/api/caja/ticket/[id]/route.ts:49:7 TS2344 Type '{ __tag__: "GET"; __param_position__: "second"; __param_type__: { params: { id: string; }; }; }' does not satisfy the constraint 'ParamCheck<RouteContext>'.
- .next/types/app/api/estadias/excedentes/route.ts:2:24 TS2306 File '/root/.openclaw/workspace-bitron/eparking/src/app/api/estadias/excedentes/route.ts' is not a module.
- .next/types/app/api/estadias/excedentes/route.ts:5:29 TS2306 File '/root/.openclaw/workspace-bitron/eparking/src/app/api/estadias/excedentes/route.ts' is not a module.
- .next/types/app/api/estadias/extensiones/route.ts:2:24 TS2306 File '/root/.openclaw/workspace-bitron/eparking/src/app/api/estadias/extensiones/route.ts' is not a module.
- .next/types/app/api/estadias/extensiones/route.ts:5:29 TS2306 File '/root/.openclaw/workspace-bitron/eparking/src/app/api/estadias/extensiones/route.ts' is not a module.
- .next/types/app/api/estadias2/[id]/route.ts:49:7 TS2344 Type '{ __tag__: "GET"; __param_position__: "second"; __param_type__: { params: { id: string; }; }; }' does not satisfy the constraint 'ParamCheck<RouteContext>'.
- .next/types/app/api/estadias2/[id]/route.ts:283:7 TS2344 Type '{ __tag__: "PATCH"; __param_position__: "second"; __param_type__: { params: { id: string; }; }; }' does not satisfy the constraint 'ParamCheck<RouteContext>'.
- .next/types/app/api/estadias2/activas/route.ts:12:13 TS2344 Type 'OmitWithTag<typeof import("/root/.openclaw/workspace-bitron/eparking/src/app/api/estadias2/activas/route"), "config" | "GET" | "DELETE" | "POST" | "PATCH" | "PUT" | "generateStaticParams" | ... 8 more ... | "OPTIONS", "">' does not satisfy the constraint '{ [x: string]: never; }'.
- .next/types/app/api/estadias2/activas/route.ts:30:4 TS2559 Type 'typeof import("/root/.openclaw/workspace-bitron/eparking/src/app/api/estadias2/activas/route")' has no properties in common with type '{ GET?: Function | undefined; HEAD?: Function | undefined; OPTIONS?: Function | undefined; POST?: Function | undefined; PUT?: Function | undefined; ... 10 more ...; maxDuration?: number | undefined; }'.
- .next/types/app/api/parking/novedades/[id]/route.ts:49:7 TS2344 Type '{ __tag__: "GET"; __param_position__: "second"; __param_type__: { params: { id: string; }; }; }' does not satisfy the constraint 'ParamCheck<RouteContext>'.
- .next/types/app/api/parking/novedades/[id]/route.ts:205:7 TS2344 Type '{ __tag__: "PUT"; __param_position__: "second"; __param_type__: { params: { id: string; }; }; }' does not satisfy the constraint 'ParamCheck<RouteContext>'.
- .next/types/app/api/parking/novedades/[id]/route.ts:244:7 TS2344 Type '{ __tag__: "DELETE"; __param_position__: "second"; __param_type__: { params: { id: string; }; }; }' does not satisfy the constraint 'ParamCheck<RouteContext>'.
- .next/types/app/api/parking/reservations/[id]/delete/route.ts:244:7 TS2344 Type '{ __tag__: "DELETE"; __param_position__: "second"; __param_type__: { params: { id: string; }; }; }' does not satisfy the constraint 'ParamCheck<RouteContext>'.
- .next/types/app/api/parking/reservations/[id]/update/route.ts:205:7 TS2344 Type '{ __tag__: "PUT"; __param_position__: "second"; __param_type__: { params: { id: string; }; }; }' does not satisfy the constraint 'ParamCheck<RouteContext>'.
- .next/types/app/api/parking/reservations/[id]/update/route.ts:283:7 TS2344 Type '{ __tag__: "PATCH"; __param_position__: "second"; __param_type__: { params: { id: string; }; }; }' does not satisfy the constraint 'ParamCheck<RouteContext>'.
- .next/types/app/api/plazas/route.ts:244:7 TS2344 Type '{ __tag__: "DELETE"; __param_position__: "second"; __param_type__: { params: { id: string; sub?: string | undefined; }; }; }' does not satisfy the constraint 'ParamCheck<RouteContext>'.
- .next/types/app/api/plazas/route.ts:283:7 TS2344 Type '{ __tag__: "PATCH"; __param_position__: "second"; __param_type__: { params: { id: string; sub?: string | undefined; }; }; }' does not satisfy the constraint 'ParamCheck<RouteContext>'.
- .next/types/app/api/v2/facturacion/estado-abonado/route.ts:2:24 TS2307 Cannot find module '../../../../../../../src/app/api/v2/facturacion/estado-abonado/route.js' or its corresponding type declarations.
- .next/types/app/api/v2/facturacion/estado-abonado/route.ts:5:29 TS2307 Cannot find module '../../../../../../../src/app/api/v2/facturacion/estado-abonado/route.js' or its corresponding type declarations.
- .next/types/app/api/v2/facturacion/pagar/route.ts:2:24 TS2307 Cannot find module '../../../../../../../src/app/api/v2/facturacion/pagar/route.js' or its corresponding type declarations.
- .next/types/app/api/v2/facturacion/pagar/route.ts:5:29 TS2307 Cannot find module '../../../../../../../src/app/api/v2/facturacion/pagar/route.js' or its corresponding type declarations.
- .next/types/app/panel-cajas-online-test/page.ts:2:24 TS2307 Cannot find module '../../../../src/app/panel-cajas-online-test/page.js' or its corresponding type declarations.
- .next/types/app/panel-cajas-online-test/page.ts:5:29 TS2307 Cannot find module '../../../../src/app/panel-cajas-online-test/page.js' or its corresponding type declarations.
- .next/types/validator.ts:89:39 TS2307 Cannot find module '../../src/app/panel-cajas-online-test/page.js' or its corresponding type declarations.
- .next/types/validator.ts:225:31 TS2344 Type 'typeof import("/root/.openclaw/workspace-bitron/eparking/src/app/api/caja/ticket/[id]/route")' does not satisfy the constraint 'RouteHandlerConfig<"/api/caja/ticket/[id]">'.
- .next/types/validator.ts:332:39 TS2306 File '/root/.openclaw/workspace-bitron/eparking/src/app/api/estadias/excedentes/route.ts' is not a module.
- .next/types/validator.ts:341:39 TS2306 File '/root/.openclaw/workspace-bitron/eparking/src/app/api/estadias/extensiones/route.ts' is not a module.
- .next/types/validator.ts:378:31 TS2344 Type 'typeof import("/root/.openclaw/workspace-bitron/eparking/src/app/api/estadias2/[id]/route")' does not satisfy the constraint 'RouteHandlerConfig<"/api/estadias2/[id]">'.
- .next/types/validator.ts:387:31 TS2559 Type 'typeof import("/root/.openclaw/workspace-bitron/eparking/src/app/api/estadias2/activas/route")' has no properties in common with type 'RouteHandlerConfig<"/api/estadias2/activas">'.
- .next/types/validator.ts:468:31 TS2344 Type 'typeof import("/root/.openclaw/workspace-bitron/eparking/src/app/api/parking/novedades/[id]/route")' does not satisfy the constraint 'RouteHandlerConfig<"/api/parking/novedades/[id]">'.
- .next/types/validator.ts:486:31 TS2344 Type 'typeof import("/root/.openclaw/workspace-bitron/eparking/src/app/api/parking/reservations/[id]/delete/route")' does not satisfy the constraint 'RouteHandlerConfig<"/api/parking/reservations/[id]/delete">'.
- .next/types/validator.ts:495:31 TS2344 Type 'typeof import("/root/.openclaw/workspace-bitron/eparking/src/app/api/parking/reservations/[id]/update/route")' does not satisfy the constraint 'RouteHandlerConfig<"/api/parking/reservations/[id]/update">'.
- .next/types/validator.ts:567:31 TS2344 Type 'typeof import("/root/.openclaw/workspace-bitron/eparking/src/app/api/plazas/route")' does not satisfy the constraint 'RouteHandlerConfig<"/api/plazas">'.
- .next/types/validator.ts:971:39 TS2307 Cannot find module '../../src/app/api/v2/facturacion/estado-abonado/route.js' or its corresponding type declarations.
- .next/types/validator.ts:980:39 TS2307 Cannot find module '../../src/app/api/v2/facturacion/pagar/route.js' or its corresponding type declarations.
