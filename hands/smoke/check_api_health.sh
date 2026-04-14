#!/usr/bin/env bash
set -euo pipefail

# hands/smoke/check_api_health.sh
# Call /api/health or fallback endpoint to validate API health
# Usage: BASE_URL=http://staging.example.com ./hands/smoke/check_api_health.sh

BASE_URL="${BASE_URL:-http://localhost:3000}"
HEALTH_ENDPOINT="${HEALTH_ENDPOINT:-/api/health}"
URL="$BASE_URL$HEALTH_ENDPOINT"

echo "[check_api_health] Checking $URL"
BODY=$(curl -sS --max-time 10 "$URL" || true)
STATUS=$(echo "$BODY" | head -n1 || true)

# If the endpoint returns JSON or text, we treat any 2xx as success via HTTP code
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$URL" || true)

if [[ "$HTTP_STATUS" =~ ^2[0-9][0-9]$ ]]; then
  echo "[check_api_health] OK: $URL returned HTTP $HTTP_STATUS"
  exit 0
else
  echo "[check_api_health] FAIL: $URL returned HTTP $HTTP_STATUS" >&2
  exit 2
fi
