#!/usr/bin/env bash
set -euo pipefail

# hands/smoke/check_app_up.sh
# Check that the base URL responds 200
# Usage: BASE_URL=http://staging.example.com ./hands/smoke/check_app_up.sh

BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "[check_app_up] Testing base URL: $BASE_URL"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BASE_URL" || true)

if [ "$STATUS" = "200" ]; then
  echo "[check_app_up] OK: $BASE_URL returned 200"
  exit 0
else
  echo "[check_app_up] FAIL: $BASE_URL returned HTTP $STATUS" >&2
  exit 2
fi
