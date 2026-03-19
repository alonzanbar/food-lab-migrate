import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAuthedContext, json, corsHeaders } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders });

  try {
    const { userId, supabaseAdmin } = await getAuthedContext(req);
    const body = await req.json();
    const tenantId = typeof body?.tenantId === "string" ? body.tenantId.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";

    if (!email) return json(400, { error: "email is required" });
    if (!password) return json(400, { error: "password is required" });
    if (!tenantId) return json(400, { error: "tenantId is required" });

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
      .eq("id", tenantId)
      .single();
    if (tenantError || !tenant) return json(404, { error: "Tenant not found" });

    // Create user directly (no email verification)
    const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: fullName ? { full_name: fullName } : undefined,
    });
    if (createError || !authUser?.user) {
      return json(500, { error: createError?.message ?? "Failed to create admin" });
    }

    // Assign to tenant and add admin role
    const { error: profileUpdateErr } = await supabaseAdmin
      .from("profiles")
      .update({ tenant_id: tenantId, full_name: fullName || authUser.user.email })
      .eq("id", authUser.user.id);
    if (profileUpdateErr) return json(500, { error: profileUpdateErr.message });

    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: authUser.user.id, role: "admin" });
    if (roleErr && !String(roleErr.message).toLowerCase().includes("duplicate")) {
      return json(500, { error: roleErr.message });
    }

    return json(200, { email });
  } catch (e) {
    return json(400, { error: e instanceof Error ? e.message : "Unknown error" });
  }
});
