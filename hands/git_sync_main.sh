#!/usr/bin/env bash
set -euo pipefail

# hands/git_sync_main.sh
# Sinopsis: sincroniza la rama main local con origin/main usando fast-forward only.
# Uso: ./hands/git_sync_main.sh

REPO_ROOT="/root/.openclaw/workspace-bitron/eparking"
cd "$REPO_ROOT"

echo "Repository: $REPO_ROOT"
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD || echo "(no branch)")
echo "Current branch: $CURRENT_BRANCH"

echo "Fetching origin..."
git fetch origin --prune

echo "Checking out main..."
git checkout main

echo "Pulling --ff-only origin/main..."
git pull --ff-only origin main

echo "Sync complete. Current branch: $(git rev-parse --abbrev-ref HEAD)"

echo "Done."