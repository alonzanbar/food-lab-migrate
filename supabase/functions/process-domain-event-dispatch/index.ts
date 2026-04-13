/**
 * Receives Database Webhook POSTs on `process_domain_events` INSERT (or manual testing).
 *
 * Configure in Supabase Dashboard → Database → Webhooks: table public.process_domain_events,
 * events INSERT, HTTP POST to this function URL, header `x-domain-events-secret: <value>`.
 * Set secrets: DOMAIN_EVENTS_WEBHOOK_SECRET (required), optional DOWNSTREAM_PROCESS_RUN_WEBHOOK_URL.
 *
 * When DOWNSTREAM_PROCESS_RUN_WEBHOOK_URL is set, forwards JSON `{ event_type, payload, id }` (POST).
 * On successful forward (2xx), sets process_domain_events.processed_at if SUPABASE_SERVICE_ROLE_KEY is set.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders, json } from "../_shared/auth.ts";

declare const Deno: {
  env: { get: (key: string) => string | undefined };
};

type WebhookBody = {
  type?: string;
  table?: string;
  record?: Record<string, unknown>;
};

function isDomainEventRecord(r: Record<string, unknown> | undefined): boolean {
  return (
    !!r &&
    typeof r.id === "string" &&
    r.event_type === "process_run.completed" &&
    typeof r.process_run_id === "string" &&
    typeof r.tenant_id === "string"
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders });

  const secret = Deno.env.get("DOMAIN_EVENTS_WEBHOOK_SECRET");
  const hdr = req.headers.get("x-domain-events-secret");
  if (!secret || hdr !== secret) {
    return json(401, { error: "Unauthorized" });
  }

  let body: WebhookBody | Record<string, unknown>;
  try {
    body = (await req.json()) as WebhookBody;
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const record =
    "record" in body && body.record && typeof body.record === "object"
      ? (body.record as Record<string, unknown>)
      : (body as Record<string, unknown>);

  if (!isDomainEventRecord(record)) {
    return json(400, { error: "Expected process_domain_events row with event_type process_run.completed" });
  }

  const downstream = Deno.env.get("DOWNSTREAM_PROCESS_RUN_WEBHOOK_URL");
  if (downstream) {
    const forwardPayload = {
      event_type: record.event_type,
      id: record.id,
      tenant_id: record.tenant_id,
      process_run_id: record.process_run_id,
      payload: record.payload ?? {},
      created_at: record.created_at,
    };

    let downstreamOk = false;
    try {
      const resp = await fetch(downstream, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(forwardPayload),
      });
      downstreamOk = resp.ok;
      if (!downstreamOk) {
        return json(502, {
          error: "Downstream webhook returned non-success",
          status: resp.status,
        });
      }
    } catch (e) {
      return json(502, {
        error: e instanceof Error ? e.message : "Downstream fetch failed",
      });
    }

    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (downstreamOk && url && serviceKey) {
      const admin = createClient(url, serviceKey);
      await admin
        .from("process_domain_events")
        .update({ processed_at: new Date().toISOString() })
        .eq("id", record.id as string);
    }
  }

  return json(200, { ok: true });
});
