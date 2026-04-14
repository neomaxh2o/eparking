#!/usr/bin/env bash
set -euo pipefail

# hands/smoke/run_all.sh
# Run all smoke checks and report summary
# Usage: BASE_URL=http://staging.example.com ./hands/smoke/run_all.sh

SCRIPTS=(
  check_app_up.sh
  check_api_health.sh
  check_db_connection.sh
  check_auth_flow.sh
)

ROOT="/root/.openclaw/workspace-bitron/eparking/hands/smoke"
cd "$ROOT"

STATUS=0
FAILURES=()

for s in "${SCRIPTS[@]}"; do
  echo "=========================================="
  echo "Running $s"
  if bash "$s"; then
    echo "$s: OK"
  else
    rc=$?
    echo "$s: FAIL (code $rc)" >&2
    STATUS=1
    FAILURES+=("$s")
  fi
done

echo "=========================================="
if [ $STATUS -eq 0 ]; then
  echo "ALL CHECKS PASSED"
  exit 0
else
  echo "SOME CHECKS FAILED:" "${FAILURES[*]}" >&2
  exit 2
fi
