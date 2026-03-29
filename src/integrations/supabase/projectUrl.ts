/** API base URL must be origin-only; a path like `/rest/v1` in env breaks resolved auth/rest routes. */
export function viteSupabaseProjectOrigin(): string {
  const raw = import.meta.env.VITE_SUPABASE_URL;
  if (raw == null || String(raw).trim() === "") return "";
  try {
    return new URL(String(raw).trim()).origin;
  } catch {
    return String(raw).trim();
  }
}
