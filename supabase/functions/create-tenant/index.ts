import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAuthedContext, json, corsHeaders } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { userId, supabaseAdmin } = await getAuthedContext(req);
    const { name } = await req.json();

    const tenantName = typeof name === "string" ? name.trim() : "";
    if (!tenantName) return json(400, { error: "name is required" });

    // Only superusers can create tenants
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const isSuperuser = (roles || []).some((r: { role?: string }) => r?.role === "superuser");
    if (!isSuperuser) {
      return json(403, { error: "Only superusers can create tenants" });
    }

    // Create tenant
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .insert({
        name: tenantName,
        status: "active",
        created_by: userId,
      })
      .select("id, name, status, created_at")
      .single();
    if (tenantError || !tenant) return json(500, { error: tenantError?.message ?? "Failed to create tenant" });

    // Assign creator to tenant only if they have no tenant yet
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();
    if (profileError) return json(500, { error: profileError.message });

    if (!profile?.tenant_id) {
      const { error: profileUpdateError } = await supabaseAdmin
        .from("profiles")
        .update({ tenant_id: tenant.id })
        .eq("id", userId);
      if (profileUpdateError) return json(500, { error: profileUpdateError.message });

      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: userId, role: "admin" });
      if (roleError && !String(roleError.message).toLowerCase().includes("duplicate")) {
        return json(500, { error: roleError.message });
      }
    }

    return json(200, { tenant });
  } catch (e) {
    return json(400, { error: e instanceof Error ? e.message : "Unknown error" });
  }
});

