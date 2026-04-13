import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PhaseEmbed = {
  id: string;
  order_index: number;
  name_he: string;
  name_en: string;
};

export type StepRunRow = {
  id: string;
  status: string;
  process_step_id: string;
  process_steps: {
    order_index: number;
    process_phase_id: string;
    process_phases: PhaseEmbed | null;
    step_definitions: { name_he: string; name_en: string } | null;
  } | null;
};

export type PhaseGroup = {
  phaseId: string;
  order_index: number;
  name_he: string;
  name_en: string;
  steps: StepRunRow[];
};

/** Generated `Database` types omit `process_*` tables; narrow cast for this query only. */
type ProcessTablesQueryClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => Promise<{ data: unknown; error: { message?: string } | null }>;
      };
    };
  };
};

export function phaseIdForStepRunRow(r: StepRunRow): string {
  const ps = r.process_steps;
  const ph = ps?.process_phases;
  return ph?.id ?? ps?.process_phase_id ?? `orphan-${r.id}`;
}

export function buildPhaseGroups(rows: StepRunRow[]): PhaseGroup[] {
  const map = new Map<string, PhaseGroup>();
  for (const r of rows) {
    const phaseId = phaseIdForStepRunRow(r);
    const ps = r.process_steps;
    const ph = ps?.process_phases;
    const order_index = ph?.order_index ?? 999;
    const name_he = ph?.name_he ?? "—";
    const name_en = ph?.name_en ?? "—";
    let g = map.get(phaseId);
    if (!g) {
      g = { phaseId, order_index, name_he, name_en, steps: [] };
      map.set(phaseId, g);
    }
    g.steps.push(r);
  }
  const list = [...map.values()];
  list.sort((a, b) => a.order_index - b.order_index);
  for (const g of list) {
    g.steps.sort((x, y) => (x.process_steps?.order_index ?? 0) - (y.process_steps?.order_index ?? 0));
  }
  return list;
}

export function useProcessRunStepRuns(
  runId: string | undefined,
  tenantId: string | null | undefined,
) {
  const [rows, setRows] = useState<StepRunRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!runId || !tenantId) return;
      const { data, error } = await (supabase as unknown as ProcessTablesQueryClient)
        .from("process_step_runs")
        .select(
          `
          id,
          status,
          process_step_id,
          process_steps (
            order_index,
            process_phase_id,
            process_phases ( id, order_index, name_he, name_en ),
            step_definitions ( name_he, name_en )
          )
        `,
        )
        .eq("process_run_id", runId)
        .eq("tenant_id", tenantId);

      if (error) {
        console.error(error);
        setRows([]);
      } else {
        const list = (data as StepRunRow[]) || [];
        list.sort((a, b) => {
          const pa = a.process_steps?.process_phases?.order_index ?? 0;
          const pb = b.process_steps?.process_phases?.order_index ?? 0;
          if (pa !== pb) return pa - pb;
          return (a.process_steps?.order_index ?? 0) - (b.process_steps?.order_index ?? 0);
        });
        setRows(list);
      }
      setLoading(false);
    })();
  }, [runId, tenantId]);

  const groups = useMemo(() => buildPhaseGroups(rows), [rows]);

  return { rows, groups, loading };
}
