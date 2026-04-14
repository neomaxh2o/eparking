#!/usr/bin/env bash
set -euo pipefail

# hands/git_commit_push.sh
# Sinopsis: añade todos los cambios, realiza commit con el mensaje dado y hace push de la rama actual.
# Uso: ./hands/git_commit_push.sh "Commit message"

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 \"Commit message\"" >&2
  exit 2
fi

COMMIT_MSG="$*"
REPO_ROOT="/root/.openclaw/workspace-bitron/eparking"
cd "$REPO_ROOT"

echo "Repository: $REPO_ROOT"

echo "Branch: $(git rev-parse --abbrev-ref HEAD)"

echo "Git status before add:"
git status --short

echo "Staging changes..."
git add .

echo "Committing..."
if git commit -m "$COMMIT_MSG"; then
  echo "Commit created."
else
  echo "No changes to commit."
fi

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo "Pushing branch $CURRENT_BRANCH to origin..."
GIT_SSH_COMMAND='ssh -o IdentitiesOnly=yes' git push -u origin "$CURRENT_BRANCH"

echo "Push complete."

echo "Done."