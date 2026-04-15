/**
 * Prints a Supabase user access_token (JWT) to stdout for curl / local API tests.
 *
 * Required env (export or set before `npm run get:jwt`):
 *   TEST_AUTH_EMAIL, TEST_AUTH_PASSWORD
 * And either pair:
 *   SUPABASE_URL + SUPABASE_ANON_KEY
 * or (same values as Vite):
 *   VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY
 *
 * Local defaults: URL http://127.0.0.1:54321, anon key from `supabase status` or .env.
 * Use a dedicated dev/test user whose profiles.tenant_id matches the data you need.
 * Do not commit TEST_AUTH_PASSWORD.
 *
 * Example:
 *   export ACCESS_TOKEN="$(npx tsx scripts/get-local-jwt.ts)"
 *   export RUN_ID='...'
 *   ./scripts/run-summary-pdf-local-example.sh
 */
import { createClient } from "@supabase/supabase-js";

function originOnly(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  try {
    return new URL(t).origin;
  } catch {
    return t;
  }
}

const urlRaw = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
const email = process.env.TEST_AUTH_EMAIL || "";
const password = process.env.TEST_AUTH_PASSWORD || "";

if (!urlRaw || !anonKey) {
  console.error(
    "Missing SUPABASE_URL/VITE_SUPABASE_URL and SUPABASE_ANON_KEY/VITE_SUPABASE_PUBLISHABLE_KEY",
  );
  process.exit(1);
}
if (!email || !password) {
  console.error("Missing TEST_AUTH_EMAIL or TEST_AUTH_PASSWORD");
  process.exit(1);
}

const supabase = createClient(originOnly(urlRaw), anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await supabase.auth.signInWithPassword({ email, password });

if (error || !data.session?.access_token) {
  console.error(error?.message || "No session returned");
  process.exit(1);
}

console.log(data.session.access_token);
