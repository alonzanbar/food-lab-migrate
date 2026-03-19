import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAuthedContext, json, corsHeaders } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders });

  try {
    const { userId, email, supabaseAdmin } = await getAuthedContext(req);
    const { token } = await req.json();

    const inviteToken = typeof token === "string" ? token.trim() : "";
    if (!inviteToken) return json(400, { error: "token is required" });

    const { data: invite, error: inviteError } = await supabaseAdmin
      .from("tenant_invites")
      .select("id, tenant_id, email, role, expires_at, used_at")
      .eq("token", inviteToken)
      .single();

    if (inviteError || !invite) return json(404, { error: "Invite not found" });
    if (invite.used_at) return json(409, { error: "Invite already used" });
    if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
      return json(410, { error: "Invite expired" });
    }

    const inviteEmail = String(invite.email || "").toLowerCase();
    const userEmail = (email || "").toLowerCase();
    if (!userEmail || inviteEmail !== userEmail) {
      return json(403, { error: "Invite email does not match current user" });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();
    if (profileError) return json(500, { error: profileError.message });

    if (profile?.tenant_id && String(profile.tenant_id) !== String(invite.tenant_id)) {
      return json(409, { error: "User already belongs to a different tenant" });
    }

    const { error: profileUpdateError } = await supabaseAdmin
      .from("profiles")
      .update({ tenant_id: invite.tenant_id })
      .eq("id", userId);
    if (profileUpdateError) return json(500, { error: profileUpdateError.message });

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: invite.role });
    if (roleError && !String(roleError.message).toLowerCase().includes("duplicate")) {
      return json(500, { error: roleError.message });
    }

    const { error: usedError } = await supabaseAdmin
      .from("tenant_invites")
      .update({ used_at: new Date().toISOString(), used_by: userId })
      .eq("id", invite.id);
    if (usedError) return json(500, { error: usedError.message });

    return json(200, { tenant_id: invite.tenant_id, role: invite.role });
  } catch (e) {
    return json(400, { error: e instanceof Error ? e.message : "Unknown error" });
  }
});

