#!/usr/bin/env bash
set -euo pipefail

# hands/deploy_eparking.sh
# Plantilla base para despliegue controlado de eparking.
# IMPORTANTE: este script es una plantilla informativa. NO ejecuta acciones de despliegue.
# Uso: revisar y completar TODOs antes de ejecutar en entornos de staging/producción.

REPO_ROOT="/root/.openclaw/workspace-bitron/eparking"
cd "$REPO_ROOT"

echo "Repository: $REPO_ROOT"
echo "Current branch: $(git rev-parse --abbrev-ref HEAD)"
echo "Last commit: $(git log --oneline -1)"
echo "Git status:"
git status --short || true

cat <<'EOF'

=== TEMPLATE DEPLOY STEPS ===
These are the expected high-level steps for a controlled deploy. DO NOT execute them automatically from this script until reviewed and approved.

1) Install / build
   TODO: npm ci && npm run build (or equivalent)
2) Database migrations
   TODO: run migration tool with dry-run in staging
3) Pre-deploy checks / smoke tests
   TODO: run basic health checks and smoke tests
4) Activate new release / restart services (staging)
   TODO: orchestrate restart, with rollback plan
5) Post-deploy validations
   TODO: run integration checks, reconciliation, logging

Notes / TODOs:
- Add commands for build and migrations specific to your infra.
- Add monitoring checks and rollback commands.
- Ensure secrets and credentials are provided by CI or secret manager.
- Never execute production-restart commands from here without explicit human approval.

EOF

echo "Template deploy script complete. Edit TODOs before use."

echo "Done."