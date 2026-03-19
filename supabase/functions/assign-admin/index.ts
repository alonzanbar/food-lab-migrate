import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAuthedContext, json, corsHeaders } from "../_shared/auth.ts";

function randomToken(bytes = 24) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders });

  try {
    const { userId, supabaseAdmin } = await getAuthedContext(req);
    const { tenantId, email } = await req.json();

    const inviteEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!inviteEmail) return json(400, { error: "email is required" });

    const tid = typeof tenantId === "string" ? tenantId.trim() : "";
    if (!tid) return json(400, { error: "tenantId is required" });

    // Only superusers can assign admins to any tenant
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const isSuperuser = (roles || []).some((r: { role?: string }) => r?.role === "superuser");
    if (!isSuperuser) {
      return json(403, { error: "Only superusers can assign admins" });
    }

    // Verify tenant exists
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .select("id")
      .eq("id", tid)
      .single();
    if (tenantError || !tenant) return json(404, { error: "Tenant not found" });

    const token = randomToken(24);

    const { data: invite, error: inviteError } = await supabaseAdmin
      .from("tenant_invites")
      .insert({
        tenant_id: tid,
        email: inviteEmail,
        role: "admin",
        token,
        created_by: userId,
      })
      .select("token, email, role, expires_at")
      .single();
    if (inviteError || !invite) return json(500, { error: inviteError?.message ?? "Failed to create invite" });

    return json(200, { invite });
  } catch (e) {
    return json(400, { error: e instanceof Error ? e.message : "Unknown error" });
  }
});
