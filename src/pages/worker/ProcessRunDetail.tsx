import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, CheckCircle2, Circle } from "lucide-react";

type StepRunRow = {
  id: string;
  status: string;
  process_step_id: string;
  process_steps: {
    order_index: number;
    process_phases: { order_index: number; name_he: string; name_en: string };
    step_definitions: { name_he: string; name_en: string };
  } | null;
};

export default function ProcessRunDetail() {
  const { processDefinitionId, runId } = useParams<{
    processDefinitionId: string;
    runId: string;
  }>();
  const { tenantId } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [rows, setRows] = useState<StepRunRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!runId || !tenantId) return;
      const { data, error } = await (supabase as any)
        .from("process_step_runs")
        .select(
          `
          id,
          status,
          process_step_id,
          process_steps (
            order_index,
            process_phases ( order_index, name_he, name_en ),
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

  const title = useMemo(() => t("process.runSteps"), [t]);

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">{t("common.loading")}</div>;
  }

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(`/worker/processes/${processDefinitionId}`)}
          className="p-2 -ms-2 text-muted-foreground"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold font-display">{title}</h2>
      </div>

      <ul className="space-y-2">
        {rows.map((r) => {
          const sd = r.process_steps?.step_definitions;
          const name = sd ? (lang === "he" ? sd.name_he : sd.name_en) : r.process_step_id;
          const done = r.status === "completed";
          return (
            <li key={r.id}>
              <button
                type="button"
                onClick={() =>
                  navigate(`/worker/processes/${processDefinitionId}/runs/${runId}/fill/${r.id}`)
                }
                className="w-full flex items-center gap-3 rounded-lg border px-4 py-3 bg-card hover:bg-muted/50 text-start"
              >
                {done ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
                )}
                <span className="flex-1 font-medium">{name}</span>
                <span className="text-xs text-muted-foreground">{r.status}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
