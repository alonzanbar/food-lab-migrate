import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { DynamicStepForm, type StepFormSubmitMeta } from "@/components/process/DynamicStepForm";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";

export default function ProcessStepFill() {
  const { processDefinitionId, runId, stepRunId } = useParams<{
    processDefinitionId: string;
    runId: string;
    stepRunId: string;
  }>();
  const { tenantId } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [schema, setSchema] = useState<Record<string, unknown> | null>(null);
  const [parameterization, setParameterization] = useState<Record<string, unknown> | null>(null);
  const [title, setTitle] = useState("");
  const [initial, setInitial] = useState<Record<string, unknown>>({});
  const [inputMode, setInputMode] = useState<string>("single_form");

  useEffect(() => {
    (async () => {
      if (!stepRunId || !tenantId) return;
      const { data, error } = await (supabase as any)
        .from("process_step_runs")
        .select(
          `
          id,
          status,
          captured_data,
          process_steps (
            parameterization,
            step_definitions ( name_he, name_en, input_mode, schema )
          )
        `,
        )
        .eq("id", stepRunId)
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (error || !data) {
        toast.error(t("common.error"));
        setLoading(false);
        return;
      }

      const ps = data.process_steps as {
        parameterization: Record<string, unknown> | null;
        step_definitions: {
          name_he: string;
          name_en: string;
          input_mode: string;
          schema: Record<string, unknown>;
        } | null;
      } | null;

      const sd = ps?.step_definitions;
      if (!sd?.schema) {
        toast.error(t("common.error"));
        setLoading(false);
        return;
      }

      setSchema(sd.schema as Record<string, unknown>);
      setInputMode(sd.input_mode || "single_form");
      setParameterization(ps?.parameterization || null);
      setTitle(lang === "he" ? sd.name_he : sd.name_en);
      const cap = (data.captured_data as Record<string, unknown>) || {};
      setInitial(cap);
      setLoading(false);
    })();
  }, [stepRunId, tenantId, lang, t]);

  async function handleSave(payload: Record<string, unknown>, meta?: StepFormSubmitMeta) {
    if (!stepRunId || !tenantId) return;
    const finalPayload = { ...payload };

    if (meta?.imageFiles) {
      for (const [key, file] of Object.entries(meta.imageFiles)) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${tenantId}/process-steps/${stepRunId}/${key}_${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("submission-images").upload(path, file);
        if (upErr) {
          console.error(upErr);
          toast.error(t("common.error"));
          return;
        }
        const { data: urlData } = supabase.storage.from("submission-images").getPublicUrl(path);
        finalPayload[key] = urlData.publicUrl;
      }
    }

    const { error } = await (supabase as any)
      .from("process_step_runs")
      .update({
        captured_data: finalPayload,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", stepRunId)
      .eq("tenant_id", tenantId);

    if (error) {
      toast.error(t("common.error"));
      return;
    }
    toast.success(t("process.stepSaved"));
    navigate(`/worker/processes/${processDefinitionId}/runs/${runId}`);
  }

  if (loading || !schema) {
    return <div className="text-center py-12 text-muted-foreground">{t("common.loading")}</div>;
  }

  const raw = schema as { input_mode?: string; fields?: unknown[]; columns?: unknown[] };
  const mode = raw.input_mode || inputMode;
  const mergedSchema =
    mode === "matrix"
      ? { input_mode: "matrix" as const, columns: (raw.columns || []) as never[] }
      : { input_mode: "single_form" as const, fields: (raw.fields || []) as never[] };

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
        <h2 className="text-xl font-bold font-display">{title}</h2>
      </div>

      <DynamicStepForm
        schema={mergedSchema as Parameters<typeof DynamicStepForm>[0]["schema"]}
        parameterization={parameterization}
        initialData={initial}
        onSubmit={handleSave}
        submitLabel={t("common.save")}
      />
    </div>
  );
}
