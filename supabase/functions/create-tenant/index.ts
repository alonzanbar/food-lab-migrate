import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAuthedContext, json, corsHeaders } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { userId, supabaseAdmin } = await getAuthedContext(req);
    const { name } = await req.json();

    const tenantName = typeof name === "string" ? name.trim() : "";
    if (!tenantName) return json(400, { error: "name is required" });

    // Create tenant
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .insert({ name: tenantName })
      .select("id, name")
      .single();
    if (tenantError || !tenant) return json(500, { error: tenantError?.message ?? "Failed to create tenant" });

    // Assign user to tenant (only if not already assigned)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();
    if (profileError) return json(500, { error: profileError.message });

    if (profile?.tenant_id && String(profile.tenant_id) !== String(tenant.id)) {
      return json(409, { error: "User already belongs to a tenant" });
    }

    const { error: profileUpdateError } = await supabaseAdmin
      .from("profiles")
      .update({ tenant_id: tenant.id })
      .eq("id", userId);
    if (profileUpdateError) return json(500, { error: profileUpdateError.message });

    // Grant admin role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" });
    if (roleError && !String(roleError.message).toLowerCase().includes("duplicate")) {
      return json(500, { error: roleError.message });
    }

    return json(200, { tenant });
  } catch (e) {
    return json(400, { error: e instanceof Error ? e.message : "Unknown error" });
  }
});

