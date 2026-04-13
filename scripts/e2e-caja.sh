#!/usr/bin/env bash
set -euo pipefail
COOKIES=/tmp/e2e_cookies.txt
CSRF_JSON=/tmp/e2e_csrf.json
rm -f $COOKIES $CSRF_JSON /tmp/e2e_* || true

# 1) get csrf
curl -s -c $COOKIES -X GET http://localhost:3010/api/auth/csrf -H 'Accept: application/json' -o $CSRF_JSON
CSRF=$(jq -r .csrfToken $CSRF_JSON)
if [ -z "$CSRF" ] || [ "$CSRF" = "null" ]; then echo "No csrf"; exit 1; fi

# 2) login as manager
curl -s -b $COOKIES -c $COOKIES -X POST http://localhost:3010/api/auth/callback/credentials \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode "csrfToken=$CSRF" \
  --data-urlencode "email=bitron_manager@intradiatrading.com.ar" \
  --data-urlencode "password=MngBitron2026!" \
  -D /tmp/e2e_headers.txt -o /tmp/e2e_login.txt

COOKIE=$(awk -F': ' '/set-cookie:/ {print $2}' /tmp/e2e_headers.txt | sed -n '1p' | sed 's/;.*//')
echo "COOKIE=$COOKIE"

# 3) open shift
OPEN_RES=$(curl -s -X POST http://localhost:3010/api/shifts/open -H "Content-Type: application/json" -H "Cookie: $COOKIE" -d '{"storeId":"69dc887dd9a014acc4f9267a","startingCash":100000}')
echo "open: $OPEN_RES"
SHIFT_ID=$(echo "$OPEN_RES" | jq -r '.shift._id')
if [ "$SHIFT_ID" = "null" ] || [ -z "$SHIFT_ID" ]; then echo "Failed to open shift"; exit 1; fi

echo "SHIFT_ID=$SHIFT_ID"

# 4) create 2 tickets
for i in 1 2; do
  T=$(curl -s -X POST http://localhost:3010/api/tickets -H "Content-Type: application/json" -H "Cookie: $COOKIE" -d "{\"shiftId\":\"$SHIFT_ID\",\"storeId\":\"69dc887dd9a014acc4f9267a\",\"total\":300000,\"items\":[{\"sku\":\"S${i}\",\"name\":\"Estadia 1h\",\"qty\":1,\"unitPrice\":300000}],\"paymentMethod\":\"efectivo\",\"payments\":[{\"method\":\"efectivo\",\"amount\":300000}]}")
  echo "ticket $i: $T"
done

# 5) register cash movement (adjustment)
ADJ=$(curl -s -X POST http://localhost:3010/api/cash-movements -H "Content-Type: application/json" -H "Cookie: $COOKIE" -d "{\"shiftId\":\"$SHIFT_ID\",\"storeId\":\"69dc887dd9a014acc4f9267a\",\"type\":\"adjustment\",\"amount\":50000,\"reason\":\"E2E adjustment\"}")
echo "adjustment: $ADJ"

# 6) close shift
CLOSE=$(curl -s -X POST http://localhost:3010/api/shifts/$SHIFT_ID -H "Content-Type: application/json" -H "Cookie: $COOKIE" -d "{\"actualCash\":700000}")
echo "close: $CLOSE"

# 7) get report
REPORT=$(curl -s -X GET http://localhost:3010/api/reports/shift/$SHIFT_ID -H "Cookie: $COOKIE")
echo "report: $REPORT"

# Done
echo "E2E finished"
