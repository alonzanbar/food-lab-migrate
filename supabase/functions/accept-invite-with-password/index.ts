import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json(500, { error: "Server configuration error" });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const body = await req.json();
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!token) return json(400, { error: "token is required" });
    if (!password || password.length < 6) return json(400, { error: "password must be at least 6 characters" });

    const { data: invite, error: inviteError } = await supabaseAdmin
      .from("tenant_invites")
      .select("id, tenant_id, email, role, expires_at, used_at")
      .eq("token", token)
      .single();

    if (inviteError || !invite) return json(404, { error: "Invite not found" });
    if (invite.used_at) return json(409, { error: "Invite already used" });
    if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
      return json(410, { error: "Invite expired" });
    }

    const inviteEmail = String(invite.email || "").toLowerCase();
    if (!inviteEmail) return json(400, { error: "Invalid invite" });

    // Try to create user first; if already exists, update password
    let userId: string;
    const { data: createData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: inviteEmail,
      password,
      email_confirm: true,
    });

    if (createData?.user) {
      userId = createData.user.id;
    } else if (createErr?.message && /already|registered|exists|duplicate/i.test(createErr.message)) {
      // User exists - get by email and update password
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const existingUser = users?.find((u) => (u.email || "").toLowerCase() === inviteEmail);
      if (!existingUser) return json(500, { error: "User exists but could not be found" });

      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, { password });
      if (updateErr) return json(500, { error: updateErr.message ?? "Failed to update password" });
      userId = existingUser.id;
    } else {
      return json(500, { error: createErr?.message ?? "Failed to create user" });
    }

    // Assign to tenant and add role
    const { error: profileErr } = await supabaseAdmin
      .from("profiles")
      .update({ tenant_id: invite.tenant_id })
      .eq("id", userId);
    if (profileErr) return json(500, { error: profileErr.message });

    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: invite.role });
    if (roleErr && !String(roleErr.message).toLowerCase().includes("duplicate")) {
      return json(500, { error: roleErr.message });
    }

    // Mark invite as used
    const { error: usedErr } = await supabaseAdmin
      .from("tenant_invites")
      .update({ used_at: new Date().toISOString(), used_by: userId })
      .eq("id", invite.id);
    if (usedErr) return json(500, { error: usedErr.message });

    return json(200, { email: inviteEmail });
  } catch (e) {
    return json(400, { error: e instanceof Error ? e.message : "Unknown error" });
  }
});
