Runbook - Auditoría Cajas (INSTALL)

1) Objetivo
- Validar la subtab "Auditoría cajas" en INSTALL local/staging.

2) Build & run (dev)
- cd /root/.openclaw/workspace-bitron/INSTALL
- npm ci
- npm run dev
- Navegar a la sección Admin -> Facturación -> Auditoría cajas

3) Smoke checks (curl)
- curl -sS "http://localhost:3000/api/v2/cajas/online" | jq '.summary'
- curl -sS -X POST "http://localhost:3000/api/v2/turno/abrir" -H 'Content-Type: application/json' -d '{"cajaId":"TEST-CAJA"}'

4) Tests
- Unit: npm test (Jest)
- E2E: npx playwright test (ejecutar en staging config con baseURL)

5) Backups
- Antes de cualquier cambio manual: copiar archivo original a INSTALL/backups/<path>.bak-<ts>

6) Notas
- Este trabajo se aplicó sólo en INSTALL/ (sin commits). Si querés que prepare el patch git, lo genero al finalizar.
