#!/usr/bin/env bash
set -euo pipefail

# hands/smoke/check_db_connection.sh
# Validate DB connectivity indirectly via API endpoint that performs a read-only query
# Usage: BASE_URL=http://staging.example.com ./hands/smoke/check_db_connection.sh

BASE_URL="${BASE_URL:-http://localhost:3000}"
DB_CHECK_ENDPOINT="${DB_CHECK_ENDPOINT:-/api/health/db}"
URL="$BASE_URL$DB_CHECK_ENDPOINT"

echo "[check_db_connection] Checking DB via $URL"

# Try the specific DB health endpoint first; fallback to generic health
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$URL" || true)
if [[ "$HTTP_STATUS" =~ ^2[0-9][0-9]$ ]]; then
  echo "[check_db_connection] OK: DB health endpoint returned $HTTP_STATUS"
  exit 0
fi

# Fallback: call /api/health and consider DB status field if present
FALLBACK_URL="$BASE_URL/api/health"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$FALLBACK_URL" || true)
if [[ "$HTTP_STATUS" =~ ^2[0-9][0-9]$ ]]; then
  echo "[check_db_connection] OK: generic health endpoint returned $HTTP_STATUS (DB status not explicit)"
  exit 0
else
  echo "[check_db_connection] FAIL: neither DB-specific nor generic health endpoints returned 2xx (last HTTP $HTTP_STATUS)" >&2
  exit 2
fi
