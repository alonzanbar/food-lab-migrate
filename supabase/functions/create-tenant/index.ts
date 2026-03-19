import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAuthedContext, json, corsHeaders } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const { userId, supabaseAdmin } = await getAuthedContext(req);
    const body = await req.json();
    const name = body?.name;
    const adminsRaw = Array.isArray(body?.admins) ? body.admins : [];
    const admins = adminsRaw
      .map((a: unknown) => {
        if (a && typeof a === "object" && "email" in a && "password" in a) {
          const obj = a as { email: string; password: string; fullName?: string };
          const email = typeof obj.email === "string" ? obj.email.trim().toLowerCase() : "";
          const password = typeof obj.password === "string" ? obj.password : "";
          const fullName = typeof obj.fullName === "string" ? obj.fullName.trim() : "";
          return email && password ? { email, password, fullName } : null;
        }
        return null;
      })
      .filter(Boolean) as { email: string; password: string; fullName: string }[];

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

    // Create admins directly (no email verification)
    const createdAdmins: { email: string }[] = [];
    const seen = new Set<string>();
    for (const { email, password, fullName } of admins) {
      if (seen.has(email)) continue;
      seen.add(email);

      const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: fullName ? { full_name: fullName } : undefined,
      });
      if (createError || !authUser?.user) {
        return json(500, { error: createError?.message ?? `Failed to create admin ${email}` });
      }

      const { error: profileUpdateErr } = await supabaseAdmin
        .from("profiles")
        .update({ tenant_id: tenant.id, full_name: fullName || authUser.user.email })
        .eq("id", authUser.user.id);
      if (profileUpdateErr) return json(500, { error: profileUpdateErr.message });

      const { error: roleErr } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: authUser.user.id, role: "admin" });
      if (roleErr && !String(roleErr.message).toLowerCase().includes("duplicate")) {
        return json(500, { error: roleErr.message });
      }

      createdAdmins.push({ email });
    }

    return json(200, { tenant, createdAdmins });
  } catch (e) {
    return json(400, { error: e instanceof Error ? e.message : "Unknown error" });
  }
});

