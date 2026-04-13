import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProcessRunStepRuns, type StepRunRow } from "@/hooks/use-process-run-step-runs";
import { ProcessStepRow } from "@/components/process";
import { ChevronLeft, CheckCircle2, Circle } from "lucide-react";

export default function ProcessPhaseSteps() {
  const { processDefinitionId, runId, phaseId } = useParams<{
    processDefinitionId: string;
    runId: string;
    phaseId: string;
  }>();
  const { tenantId } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const { groups, loading } = useProcessRunStepRuns(runId, tenantId);

  const group = useMemo(() => groups.find((g) => g.phaseId === phaseId), [groups, phaseId]);

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">{t("common.loading")}</div>;
  }

  if (!group) {
    return (
      <div className="space-y-4 py-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`/worker/processes/${processDefinitionId}/runs/${runId}`)}
            className="p-2 -ms-2 text-muted-foreground"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold font-display">{t("common.noData")}</h2>
        </div>
        <p className="text-sm text-muted-foreground">{t("process.phaseNotFound")}</p>
      </div>
    );
  }

  const phaseTitle = lang === "he" ? group.name_he : group.name_en;

  const renderStepRow = (r: StepRunRow) => {
    const sd = r.process_steps?.step_definitions;
    const name = sd ? (lang === "he" ? sd.name_he : sd.name_en) : r.process_step_id;
    const done = r.status === "completed";
    return (
      <li key={r.id}>
        <ProcessStepRow
          leading={
            done ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
            )
          }
          title={name}
          trailing={r.status}
          onClick={() =>
            navigate(
              `/worker/processes/${processDefinitionId}/runs/${runId}/phases/${encodeURIComponent(group.phaseId)}/fill/${r.id}`,
            )
          }
        />
      </li>
    );
  };

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(`/worker/processes/${processDefinitionId}/runs/${runId}`)}
          className="p-2 -ms-2 text-muted-foreground"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold font-display">{phaseTitle}</h2>
      </div>
      <p className="text-sm text-muted-foreground">{t("process.phaseStepsSubtitle")}</p>
      <ul className="space-y-2">{group.steps.map(renderStepRow)}</ul>
    </div>
  );
}
