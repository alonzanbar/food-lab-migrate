import type { SupabaseClient } from "@supabase/supabase-js";

/** Ordered process steps for a definition (phase order, then step order). */
export async function fetchProcessStepsOrdered(
  supabase: SupabaseClient,
  processDefinitionId: string,
) {
  const { data: phases, error: e1 } = await (supabase as any)
    .from("process_phases")
    .select("id, order_index, code, name_he, name_en")
    .eq("process_definition_id", processDefinitionId)
    .order("order_index", { ascending: true });

  if (e1) throw e1;
  if (!phases?.length) return [];

  const out: Array<{
    process_step: Record<string, unknown>;
    phase: (typeof phases)[0];
  }> = [];

  for (const ph of phases) {
    const { data: steps, error: e2 } = await (supabase as any)
      .from("process_steps")
      .select(
        `
        id,
        order_index,
        is_final_step,
        parameterization,
        ui_config,
        step_definitions (
          id,
          code,
          name_he,
          name_en,
          input_mode,
          schema,
          supports_matrix
        )
      `,
      )
      .eq("process_phase_id", ph.id)
      .order("order_index", { ascending: true });

    if (e2) throw e2;
    for (const row of steps || []) {
      out.push({ process_step: row as Record<string, unknown>, phase: ph });
    }
  }

  return out;
}

export async function createProcessRunWithStepRows(
  supabase: SupabaseClient,
  params: {
    tenantId: string;
    processDefinitionId: string;
    startedBy: string;
  },
) {
  const { data: run, error: eRun } = await (supabase as any)
    .from("process_runs")
    .insert({
      tenant_id: params.tenantId,
      process_definition_id: params.processDefinitionId,
      status: "in_progress",
      started_by: params.startedBy,
    })
    .select("id")
    .single();

  if (eRun) throw eRun;

  const ordered = await fetchProcessStepsOrdered(supabase, params.processDefinitionId);
  if (ordered.length === 0) return { runId: run.id };

  const inserts = ordered.map((o) => ({
    process_run_id: run.id,
    process_step_id: o.process_step.id as string,
    status: "pending" as const,
  }));

  const { error: eSteps } = await (supabase as any).from("process_step_runs").insert(inserts);
  if (eSteps) throw eSteps;

  return { runId: run.id };
}
