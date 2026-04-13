import React, { useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProcessRunStepRuns, phaseIdForStepRunRow } from "@/hooks/use-process-run-step-runs";
import { readLastOpenedStep, clearLastOpenedStep } from "@/lib/lastOpenedProcessStep";
import { PhaseNavRow } from "@/components/process";
import { ChevronLeft } from "lucide-react";

export default function ProcessRunDetail() {
  const { processDefinitionId, runId } = useParams<{
    processDefinitionId: string;
    runId: string;
  }>();
  const { tenantId } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const resumeDone = useRef(false);

  const { groups, loading } = useProcessRunStepRuns(runId, tenantId);

  const title = useMemo(() => t("process.runPhases"), [t]);

  useEffect(() => {
    if (loading || !tenantId || !runId || !processDefinitionId || groups.length === 0) return;
    if (resumeDone.current) return;
    const last = readLastOpenedStep(tenantId, runId);
    if (!last || last.processDefinitionId !== processDefinitionId) return;

    const row = groups.flatMap((g) => g.steps).find((s) => s.id === last.stepRunId);
    if (!row) {
      clearLastOpenedStep(tenantId, runId);
      return;
    }
    if (row.status === "completed") {
      clearLastOpenedStep(tenantId, runId);
      return;
    }

    resumeDone.current = true;
    const phaseId = phaseIdForStepRunRow(row);
    navigate(
      `/worker/processes/${processDefinitionId}/runs/${runId}/phases/${encodeURIComponent(phaseId)}/fill/${last.stepRunId}`,
      { replace: true },
    );
  }, [loading, tenantId, runId, processDefinitionId, groups, navigate]);

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
                <PhaseNavRow
                  title={phaseTitle}
                  allDone={allDone}
                  done={done}
                  total={total}
                  onClick={() =>
                    navigate(
                      `/worker/processes/${processDefinitionId}/runs/${runId}/phases/${encodeURIComponent(g.phaseId)}`,
                    )
                  }
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
