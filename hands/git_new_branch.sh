#!/usr/bin/env bash
set -euo pipefail

# hands/git_new_branch.sh
# Sinopsis: crear y cambiar a una nueva rama basada en main.
# Uso: ./hands/git_new_branch.sh <new-branch-name>

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <new-branch-name>" >&2
  exit 2
fi

NEW_BRANCH=$1
REPO_ROOT="/root/.openclaw/workspace-bitron/eparking"
cd "$REPO_ROOT"

echo "Repository: $REPO_ROOT"

echo "Ensuring main is up-to-date..."
git fetch origin --prune

git checkout main
git pull --ff-only origin main

echo "Creating and switching to branch: $NEW_BRANCH"
git checkout -b "$NEW_BRANCH"

echo "Now on branch: $(git rev-parse --abbrev-ref HEAD)"

echo "Done."