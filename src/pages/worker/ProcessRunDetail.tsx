import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProcessRunStepRuns, phaseIdForStepRunRow } from "@/hooks/use-process-run-step-runs";
import { readLastOpenedStep, clearLastOpenedStep } from "@/lib/lastOpenedProcessStep";
import { downloadRunSummaryPdf } from "@/lib/downloadRunSummaryPdf";
import { HierarchyNavBar, PhaseNavRow } from "@/components/process";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Download } from "lucide-react";
import { toast } from "sonner";

type ProcessRunStatusClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => {
          maybeSingle: () => Promise<{ data: unknown; error: { message?: string } | null }>;
        };
      };
    };
  };
};

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
  const [runStatus, setRunStatus] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const title = useMemo(() => t("process.runPhases"), [t]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!runId || !tenantId) return;
      const { data, error } = await (supabase as unknown as ProcessRunStatusClient)
        .from("process_runs")
        .select("status")
        .eq("id", runId)
        .eq("tenant_id", tenantId)
        .maybeSingle();
      if (cancelled) return;
      if (!error && data && typeof (data as { status?: string }).status === "string") {
        setRunStatus((data as { status: string }).status);
      } else {
        setRunStatus(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [runId, tenantId]);

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

  async function handleDownloadPdf() {
    if (!runId) return;
    setPdfLoading(true);
    try {
      await downloadRunSummaryPdf(supabase, { processRunId: runId, lang });
    } catch (e) {
      console.error(e);
      toast.error(t("process.pdfDownloadFailed"));
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <div className="space-y-4 py-4">
      <HierarchyNavBar
        backTo={`/worker/processes/${processDefinitionId}`}
        backLabel={t("common.back")}
        onNavigate={navigate}
        items={[
          { label: title, current: true },
        ]}
      />
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-bold font-display flex-1 min-w-0">{title}</h2>
        {runStatus === "completed" ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 gap-1"
            disabled={pdfLoading}
            onClick={handleDownloadPdf}
          >
            <Download className="h-4 w-4" />
            {pdfLoading ? t("common.loading") : t("process.downloadRunPdf")}
          </Button>
        ) : null}
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
