# Rotate Secrets Playbook — eparking

**Propósito:** Runbook operativo para la rotación segura de secretos en el repositorio eparking. NO ejecutar pasos sin coordinar y autorización.

--

## Índice

1. Resumen y alcance
2. Inventario y matriz de secretos (prioridad)
3. Reglas generales y consideraciones previas
4. Procedimiento paso a paso por secreto
   - MONGODB_URI
   - ABONADOS_PAYMENT_WEBHOOK_SECRET
   - AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY
   - NEXTAUTH_SECRET
   - GOOGLE_SECRET
   - INSTAGRAM_CLIENT_SECRET
   - Otros
5. Orden recomendado de rotación
6. Checklist de validación post-rotación
7. Rollback strategy
8. Comunicaciones y coordinación
9. Apéndice: comandos de ejemplo y notas operativas

---

## 1. Resumen y alcance

Este runbook describe cómo rotar de forma segura las credenciales potencialmente expuestas en el repo `eparking`. Cubre inventario, steps seguros por entorno (dev / staging / prod), validaciones y rollback. NO reescribe historial ni ejecuta rotación automática: es un plan operativo.

## 2. Inventario y matriz (prioridad, ubicación, riesgo)

| Prioridad | Secreto | Ubicación típica | Riesgo si expuesto |
|---:|---|---|---|
| 1 | MONGODB_URI | .env.local (dev), secret manager/host env (staging/prod) | Acceso a datos (alto) |
| 2 | ABONADOS_PAYMENT_WEBHOOK_SECRET | .env / provider webhook config | Fraude / webhooks inválidos (alto) |
| 3 | AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY | CI / host env / secrets manager | Acceso infra (alto) |
| 4 | NEXTAUTH_SECRET | server env / secret manager | Invalidación sessions (alto) |
| 5 | GOOGLE_SECRET | provider dashboard / server secrets | OAuth failure (medio-alto) |
| 6 | INSTAGRAM_CLIENT_SECRET | provider dashboard / server secrets | OAuth failure (medio) |
| 7 | SENTRY_DSN, DROPBOX_CLIENT_SECRET, etc. | secret manager / server env | Observability / integration risk (medio) |

> Nota: la lista no es exhaustiva; confirmar inventario completo antes de rotar.

## 3. Reglas generales (previas a cualquier rotación)

- Coordinar con el equipo: responsable, ventana, contacto de rollback. Documentar en ticket.  
- Crear nuevos secretos antes de desactivar los antiguos.  
- Probar en staging antes de prod.  
- No reescribir historial Git en esta fase (posible acción posterior con BFG si hay exposición comprobada).  
- Mantener backups (DB snapshot) antes de rotación de DB.

## 4. Procedimiento por secreto (paso a paso)

### A. MONGODB_URI  (DB connection string)
**Dónde:** staging/prod env, GitHub Secrets (para CI) opcionalmente.

**Impacto:** Si se actualiza sin coordinar, la app puede perder conexión → downtime.

**Pasos (staging primero):**
1. Crear nuevo usuario DB con permisos mínimos o generar nueva password (Atlas/DB UI o admin API).  
2. Insert new credentials into staging secret store (Vault/AWS Secrets/GH Secrets for CI).  
3. Update staging app env var MONGODB_URI to new value (do not delete old).  
4. Reload/restart staging app gracefully.  
5. Run smoke tests: simple reads/writes, reconciliation jobs.  
6. Monitor logs/metrics for 15–30 min.  
7. If OK, schedule prod window and repeat for prod.  

**Validation:** reads/writes succeed; no errors in logs; background jobs run.  
**Rollback:** revert secret to old URI in secret manager and reload; restore DB snapshot if required.

---

### B. ABONADOS_PAYMENT_WEBHOOK_SECRET
**Dónde:** provider webhook config + server env.

**Impacto:** webhooks rejected → missed transactions.

**Pasos:**
1. If provider supports key rotation: request new key or create new endpoint.  
2. Add new secret in staging secrets and configure app to accept both old and new secret (if possible).  
3. Send test webhooks from provider or simulate payloads to validate acceptance.  
4. Once validated, update prod secret in maintenance window.  

**Validation:** provider webhooks accepted; reconcile logs.  
**Rollback:** re-enable old secret acceptance.

---

### C. AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY
**Dónde:** CI or server env.

**Impacto:** full infra access.

**Pasos:**
1. Create new IAM key (least privilege).  
2. Add key to GitHub Secrets and staging host secret store.  
3. Update consumers (CI job, backup scripts) to use new key; test small S3 read/list.  
4. After validation, revoke old key.

**Validation:** CI tasks that need AWS succeed (S3 list/read).  
**Rollback:** revert to old keys in secret store temporarily.

---

### D. NEXTAUTH_SECRET
**Dónde:** server env (staging/prod), GitHub Secrets (CI if needed).

**Impacto:** rotating invalidates sessions (users logged out). Plan for user impact.

**Pasos:**
1. Generate new secret.  
2. If code supports key rotation (verify), enable dual verification: accept old while signing with new.  
3. Update staging secret and validate login/session flows.  
4. For prod, schedule maintenance notifying users (if no dual-verify).  

**Validation:** logins work; session cookies accepted.  
**Rollback:** revert to old secret.

---

### E. OAuth client secrets (GOOGLE_SECRET, INSTAGRAM_CLIENT_SECRET)
**Dónde:** provider console and server secrets.

**Impacto:** OAuth login failures.

**Pasos:**
1. Regenerate secret in provider console (or create new OAuth client if needed).  
2. Add new secret to staging secrets and test OAuth flows.  
3. Update prod after validation.

**Validation:** successful OAuth login and token exchange.  
**Rollback:** restore old secret in provider console and staging/prod as needed.

---

### F. Otros (SENTRY_DSN, DROPBOX_CLIENT_SECRET, etc.)
- Apply similar pattern: create new token, update staging, test integration, update prod, revoke old.

## 5. Orden recomendado de rotación (ejecución práctica)
1. MONGODB_URI  
2. ABONADOS_PAYMENT_WEBHOOK_SECRET  
3. AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY  
4. NEXTAUTH_SECRET  
5. GOOGLE_SECRET / INSTAGRAM_CLIENT_SECRET  
6. SENTRY_DSN and other lower-risk keys

> Razonamiento: data + payment keys first, infra keys next, then auth/integration keys.

## 6. Checklist de validación post-rotación (por secreto)
- [ ] Nuevo secret creado y almacenado en secret manager / GH Secrets.  
- [ ] Staging updated and app reloaded.  
- [ ] Smoke tests pass (list tests executed).  
- [ ] Monitoring shows no errors for 15–30 min.  
- [ ] Prod window completed and validated.  
- [ ] Old secret revoked after grace period.  
- [ ] Audit log updated (who / when / why).

## 7. Rollback strategy (resumen)
- Keep old secret active until staging validation OK.  
- If prod fails, re-apply old secret in secret store and reload.  
- For DB errors, restore snapshot if data inconsistency appears.  
- Communicate rollback to stakeholders and document incident.

## 8. Comunicaciones y coordinación
- Before action: announce (channel, start time, expected impact).  
- During: live channel for operators.  
- After: post-mortem if issues.

## 9. Apéndice: comandos de ejemplo (templates)
- **Force add GitHub Secret (operator with token):**
  - `gh secret set MONGODB_URI -R neomaxh2o/eparking --body "$NEW_MONGODB_URI"`  
- **Systemd env update (example):**
  - `sudo systemctl edit --full eparking.service` (add `Environment="MONGODB_URI=..."`)  
  - `sudo systemctl daemon-reload && sudo systemctl restart eparking`  
- **Mongo test (simple):** use a tiny script that connects and performs a read/write.  

---

**WARNING:** Algunos providers no permiten rotación instantánea sin invalidar tokens o requieren cambios en dashboards. Siempre verificar provider docs.

---

*Documento generado por BITRON — no incluye secretos reales.*
