#!/usr/bin/env bash
# Local smoke test for run-summary-pdf Edge function.
#
# Prereqs: supabase start; supabase functions serve (with network for font CDN).
# Tenant seed: 67dfa2fa-e523-40b7-8f8b-ff8268fd1de5 (pasteurized egg migrations).
#
# 1) Pick a completed run (Supabase Studio SQL or psql):
#    SELECT id, status FROM public.process_runs
#    WHERE tenant_id = '67dfa2fa-e523-40b7-8f8b-ff8268fd1de5' AND status = 'completed'
#    ORDER BY completed_at DESC NULLS LAST LIMIT 5;
#
# 2) JWT — either:
#    a) Log in in the app; DevTools → Application → Local Storage → copy access_token; or
#    b) Password sign-in (dev user only; see scripts/get-local-jwt.ts):
#         cd repo && export $(grep -v '^#' .env | xargs)   # optional: load VITE_* vars
#         export TEST_AUTH_EMAIL='...' TEST_AUTH_PASSWORD='...'
#         export ACCESS_TOKEN="$(npx tsx scripts/get-local-jwt.ts)"
#      (Prefer npx tsx over npm run get:jwt so stdout is only the token.)
#
# 3) Keys: SUPABASE_ANON_KEY = same value as VITE_SUPABASE_PUBLISHABLE_KEY (see .env).
#
# Usage:
#   export ACCESS_TOKEN='eyJ...'   # or capture via get-local-jwt.ts as above
#   export RUN_ID='<uuid>'
#   export SUPABASE_ANON_KEY='...'
#   ./scripts/run-summary-pdf-local-example.sh
#
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${OUT:-/tmp/run-summary-pdf-test.pdf}"
SUPABASE_URL="${SUPABASE_URL:-http://127.0.0.1:54321}"
LANG="${LANG:-he}"

: "${ACCESS_TOKEN:?Set ACCESS_TOKEN (Bearer JWT for tenant user)}"
: "${RUN_ID:?Set RUN_ID (process_runs.id, status must be completed)}"
: "${SUPABASE_ANON_KEY:?Set SUPABASE_ANON_KEY (anon / publishable key)}"

curl -sS -o "$OUT" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  --data "{\"process_run_id\":\"${RUN_ID}\",\"lang\":\"${LANG}\"}" \
  "${SUPABASE_URL}/functions/v1/run-summary-pdf"

echo "Wrote ${OUT} (from ${ROOT})"
file "$OUT" || true
