import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { createProcessRunWithStepRows } from "@/lib/processRuntime";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Play } from "lucide-react";
import { toast } from "sonner";

type ProcessDef = {
  id: string;
  name_he: string;
  name_en: string;
  code: string;
  version: string;
};

type RunRow = {
  id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
};

export default function ProcessRuns() {
  const { processDefinitionId } = useParams<{ processDefinitionId: string }>();
  const { tenantId, user } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [defn, setDefn] = useState<ProcessDef | null>(null);
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const load = async () => {
    if (!processDefinitionId || !tenantId) return;
    const { data: d } = await (supabase as any)
      .from("process_definitions")
      .select("id, code, name_he, name_en, version")
      .eq("id", processDefinitionId)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    setDefn((d as ProcessDef) || null);

    const { data: r } = await (supabase as any)
      .from("process_runs")
      .select("id, status, started_at, completed_at")
      .eq("process_definition_id", processDefinitionId)
      .eq("tenant_id", tenantId)
      .order("started_at", { ascending: false });
    setRuns((r as RunRow[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [processDefinitionId, tenantId]);

  async function startNewRun() {
    if (!processDefinitionId || !tenantId || !user?.id) return;
    setStarting(true);
    try {
      const { runId } = await createProcessRunWithStepRows(supabase, {
        tenantId,
        processDefinitionId,
        startedBy: user.id,
      });
      toast.success(t("process.runStarted"));
      navigate(`/worker/processes/${processDefinitionId}/runs/${runId}`);
    } catch (e: unknown) {
      console.error(e);
      toast.error(t("common.error"));
    } finally {
      setStarting(false);
    }
  }

  if (loading || !defn) {
    return <div className="text-center py-12 text-muted-foreground">{t("common.loading")}</div>;
  }

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate("/worker/processes")}
          className="p-2 -ms-2 text-muted-foreground"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-xl font-bold font-display">
            {lang === "he" ? defn.name_he : defn.name_en}
          </h2>
          <p className="text-sm text-muted-foreground">{defn.code}</p>
        </div>
      </div>

      <Button
        className="w-full h-12 gap-2"
        onClick={startNewRun}
        disabled={starting}
      >
        <Play className="w-5 h-5" />
        {starting ? t("common.loading") : t("process.startNewRun")}
      </Button>

      <h3 className="font-semibold text-sm text-muted-foreground pt-2">{t("process.previousRuns")}</h3>
      {runs.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("process.noRuns")}</p>
      ) : (
        <ul className="space-y-2">
          {runs.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => navigate(`/worker/processes/${processDefinitionId}/runs/${r.id}`)}
                className="w-full text-start rounded-lg border px-4 py-3 bg-card hover:bg-muted/50"
              >
                <div className="font-medium">{new Date(r.started_at).toLocaleString(lang === "he" ? "he-IL" : "en-US")}</div>
                <div className="text-sm text-muted-foreground">
                  {t("common.status")}: {r.status}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
