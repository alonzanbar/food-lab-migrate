import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// This file runs on Supabase Edge (Deno), but repository tooling may not define `Deno`.
declare const Deno: {
  env: {
    get: (key: string) => string | undefined;
  };
};

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export type AuthedRequestContext = {
  userId: string;
  email: string | null;
  supabaseAdmin: ReturnType<typeof createClient>;
};

export async function getAuthedContext(req: Request): Promise<AuthedRequestContext> {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase configuration");
  }

  const authorizationHeader =
    req.headers.get("Authorization") || req.headers.get("authorization") || "";
  if (!authorizationHeader.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header");
  }
  const accessToken = authorizationHeader.replace(/^Bearer\s+/i, "").trim();
  if (!accessToken) throw new Error("Missing access token");

  const userResp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: SUPABASE_SERVICE_ROLE_KEY,
    },
  });

  if (!userResp.ok) {
    throw new Error("Invalid JWT");
  }

  const userJson = await userResp.json();
  const userId = userJson?.id;
  if (!userId) throw new Error("Invalid JWT");

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  return {
    userId,
    email: typeof userJson?.email === "string" ? userJson.email : null,
    supabaseAdmin,
  };
}

export function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

