/**
 * POST JSON { process_run_id, lang: "he" | "en" } → application/pdf
 * Auth: Bearer JWT; caller profile.tenant_id must match process_runs.tenant_id.
 * Run must be status "completed". Limits: max 120 step runs.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { buildRunReportFromDb, type ProcessRunInput, type StepRunInput } from "../_shared/buildRunReport.ts";
import type { Lang } from "../_shared/runSummaryPdfFlatten.ts";
import { corsHeaders, getAuthedContext, json } from "../_shared/auth.ts";
import { generateRunReportPdfBytes } from "./reportLayout.ts";

const MAX_STEP_RUNS = 120;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders });

  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  try {
    const { userId, supabaseAdmin } = await getAuthedContext(req);

    let body: { process_run_id?: string; lang?: string };
    try {
      body = await req.json();
    } catch {
      return json(400, { error: "Invalid JSON body" });
    }

    const processRunId = typeof body.process_run_id === "string" ? body.process_run_id.trim() : "";
    const lang: Lang = body.lang === "he" ? "he" : "en";
    if (!processRunId) return json(400, { error: "process_run_id is required" });

    const { data: profile, error: pe } = await supabaseAdmin
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .maybeSingle();

    if (pe || !profile?.tenant_id) {
      return json(403, { error: "Profile or tenant not found" });
    }

    const tenantId = profile.tenant_id as string;

    const { data: run, error: re } = await supabaseAdmin
      .from("process_runs")
      .select(
        `
        id,
        status,
        batch_ref,
        started_at,
        completed_at,
        tenant_id,
        process_definition_id,
        process_definitions ( code, name_he, name_en, version )
      `,
      )
      .eq("id", processRunId)
      .maybeSingle();

    if (re || !run) return json(404, { error: "Run not found" });
    if ((run as { tenant_id: string }).tenant_id !== tenantId) {
      return json(403, { error: "Tenant mismatch" });
    }
    if ((run as { status: string }).status !== "completed") {
      return json(409, { error: "Run is not completed" });
    }

    const { data: stepRows, error: se } = await supabaseAdmin
      .from("process_step_runs")
      .select(
        `
        id,
        status,
        captured_data,
        completed_at,
        process_steps (
          order_index,
          process_phase_id,
          process_phases ( order_index, name_he, name_en ),
          step_definitions ( name_he, name_en, input_mode, schema )
        )
      `,
      )
      .eq("process_run_id", processRunId)
      .eq("tenant_id", tenantId);

    if (se) return json(500, { error: se.message });

    const rows = (stepRows || []) as StepRunInput[];
    if (rows.length > MAX_STEP_RUNS) {
      return json(413, { error: `Too many step runs (max ${MAX_STEP_RUNS})` });
    }

    const generatedAt = new Date().toISOString();
    const report = buildRunReportFromDb(run as ProcessRunInput, rows, lang, generatedAt);

    let pdfBytes: Uint8Array;
    try {
      pdfBytes = await generateRunReportPdfBytes(report);
    } catch (err) {
      console.error(err);
      return json(502, { error: err instanceof Error ? err.message : "PDF generation failed" });
    }

    const runAny = run as { id: string };
    const short = runAny.id.replace(/-/g, "").slice(0, 8);
    const day = generatedAt.slice(0, 10).replace(/-/g, "");
    const filename = `run-${short}-${day}.pdf`;

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg === "Missing or invalid Authorization header" || msg === "Invalid JWT") {
      return json(401, { error: msg });
    }
    console.error(e);
    return json(500, { error: msg });
  }
});
