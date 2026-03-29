import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProcessRunStepRuns } from "@/hooks/use-process-run-step-runs";
import { ChevronLeft, ChevronRight, CheckCircle2, Circle } from "lucide-react";

export default function ProcessRunDetail() {
  const { processDefinitionId, runId } = useParams<{
    processDefinitionId: string;
    runId: string;
  }>();
  const { tenantId } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const { groups, loading } = useProcessRunStepRuns(runId, tenantId);

  const title = useMemo(() => t("process.runPhases"), [t]);

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

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("common.noData")}</p>
      ) : (
        <ul className="space-y-2">
          {groups.map((g) => {
            const phaseTitle = lang === "he" ? g.name_he : g.name_en;
            const total = g.steps.length;
            const done = g.steps.filter((s) => s.status === "completed").length;
            const allDone = total > 0 && done === total;
            return (
              <li key={g.phaseId}>
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/worker/processes/${processDefinitionId}/runs/${runId}/phases/${encodeURIComponent(g.phaseId)}`,
                    )
                  }
                  className="w-full flex items-center gap-3 rounded-lg border px-4 py-3 bg-card hover:bg-muted/50 text-start"
                >
                  {allDone ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
                  )}
                  <span className="flex-1 font-semibold">{phaseTitle}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {done}/{total}
                  </span>
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
