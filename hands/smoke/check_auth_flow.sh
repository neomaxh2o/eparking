#!/usr/bin/env bash
set -euo pipefail

# hands/smoke/check_auth_flow.sh
# Validate auth endpoints respond (NextAuth service availability), without performing login
# Usage: BASE_URL=http://staging.example.com ./hands/smoke/check_auth_flow.sh

BASE_URL="${BASE_URL:-http://localhost:3000}"
AUTH_SESSION_ENDPOINT="${AUTH_SESSION_ENDPOINT:-/api/auth/session}"
URL="$BASE_URL$AUTH_SESSION_ENDPOINT"

echo "[check_auth_flow] Checking auth endpoint: $URL"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$URL" || true)

# NextAuth session endpoint may return 200 (no session) or 401; we accept 200/401 as endpoint reachable
if [[ "$HTTP_STATUS" == "200" ]] || [[ "$HTTP_STATUS" == "401" ]]; then
  echo "[check_auth_flow] OK: auth endpoint responded HTTP $HTTP_STATUS"
  exit 0
else
  echo "[check_auth_flow] FAIL: auth endpoint responded HTTP $HTTP_STATUS" >&2
  exit 2
fi
