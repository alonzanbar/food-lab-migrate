import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAuthedContext, json, corsHeaders } from "../_shared/auth.ts";

function randomToken(bytes = 24) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const { userId, supabaseAdmin } = await getAuthedContext(req);
    const { email, role } = await req.json();

    const inviteEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!inviteEmail) return json(400, { error: "email is required" });

    const inviteRole = role === "admin" ? "admin" : "worker";

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();
    if (profileError) return json(500, { error: profileError.message });
    if (!profile?.tenant_id) return json(403, { error: "Unauthorized (missing tenant)" });

    const { data: roles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (rolesError) return json(500, { error: rolesError.message });

    const isAdmin = (roles || []).some((r: any) => r?.role === "admin");
    if (!isAdmin) return json(403, { error: "Unauthorized (admin only)" });

    const token = randomToken(24);

    const { data: invite, error: inviteError } = await supabaseAdmin
      .from("tenant_invites")
      .insert({
        tenant_id: profile.tenant_id,
        email: inviteEmail,
        role: inviteRole,
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

