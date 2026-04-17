import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import {
  DynamicStepForm,
  type StepFormSubmitMeta,
} from "@/components/process/DynamicStepForm";
import { HierarchyNavBar } from "@/components/process";
import { toast } from "sonner";
import {
  writeLastOpenedStep,
  clearLastOpenedStep,
} from "@/lib/lastOpenedProcessStep";
import { downloadRunSummaryPdf } from "@/lib/downloadRunSummaryPdf";
import {
  mergeFlatStepInitial,
  mergeMatrixRowsInitial,
  pickFieldDefaults,
  type FieldDefLike,
} from "@/lib/mergeStepFieldDefaults";

function phaseIdFromProcessSteps(
  stepRunRowId: string,
  ps: {
    process_phase_id: string;
    process_phases: { id: string } | null;
  } | null,
): string {
  return ps?.process_phases?.id ?? ps?.process_phase_id ?? `orphan-${stepRunRowId}`;
}

type ProcessStepRunsSelectClient = {
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

type ProcessStepRunsUpdateClient = {
  from: (table: string) => {
    update: (patch: Record<string, unknown>) => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => Promise<{ error: { message?: string } | null }>;
      };
    };
  };
};

export default function ProcessStepFill() {
  const { processDefinitionId, runId, phaseId, stepRunId } = useParams<{
    processDefinitionId: string;
    runId: string;
    phaseId: string;
    stepRunId: string;
  }>();
  const { tenantId } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const stepsListPath = useMemo(
    () =>
      phaseId
        ? `/worker/processes/${processDefinitionId}/runs/${runId}/phases/${encodeURIComponent(phaseId)}`
        : `/worker/processes/${processDefinitionId}/runs/${runId}`,
    [processDefinitionId, runId, phaseId],
  );
  const runPhasesPath = useMemo(
    () => `/worker/processes/${processDefinitionId}/runs/${runId}`,
    [processDefinitionId, runId],
  );

  const [loading, setLoading] = useState(true);
  const [schema, setSchema] = useState<Record<string, unknown> | null>(null);
  const [parameterization, setParameterization] = useState<Record<string, unknown> | null>(null);
  const [title, setTitle] = useState("");
  const [initial, setInitial] = useState<Record<string, unknown>>({});
  const [inputMode, setInputMode] = useState<string>("single_form");
  const [isFinalStep, setIsFinalStep] = useState(false);
  const [phaseTitle, setPhaseTitle] = useState("");

  function asFieldList(raw: unknown): FieldDefLike[] {
    if (!Array.isArray(raw)) return [];
    return raw.filter(
      (x): x is FieldDefLike =>
        !!x && typeof x === "object" && typeof (x as FieldDefLike).key === "string",
    );
  }

  async function applyNameSignatureUploads(
    finalPayload: Record<string, unknown>,
    meta: StepFormSubmitMeta | undefined,
  ): Promise<boolean> {
    if (!meta?.nameSignatureFiles || !stepRunId || !tenantId) return true;
    for (const [key, file] of Object.entries(meta.nameSignatureFiles)) {
      const ext = file.name.split(".").pop() || "png";
      const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, "_");
      const path = `${tenantId}/process-steps/${stepRunId}/${safeKey}_sig_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("submission-images").upload(path, file);
      if (upErr) {
        console.error(upErr);
        toast.error(t("common.error"));
        return false;
      }
      const { data: urlData } = supabase.storage.from("submission-images").getPublicUrl(path);
      if (key.includes("::")) {
        const parts = key.split("::");
        if (parts.length !== 2) continue;
        const ri = parseInt(parts[0], 10);
        if (Number.isNaN(ri)) continue;
        const fieldKey = parts[1];
        const rows = finalPayload.rows;
        if (!Array.isArray(rows) || ri < 0 || ri >= rows.length) continue;
        const row = rows[ri] as Record<string, unknown>;
        const block = row[fieldKey];
        if (block && typeof block === "object" && !Array.isArray(block)) {
          (block as Record<string, unknown>).signatureUrl = urlData.publicUrl;
        }
      } else {
        const block = finalPayload[key];
        if (block && typeof block === "object" && !Array.isArray(block)) {
          (block as Record<string, unknown>).signatureUrl = urlData.publicUrl;
        }
      }
    }
    return true;
  }

  useEffect(() => {
    (async () => {
      if (!stepRunId || !tenantId) return;
      const { data, error } = await (supabase as unknown as ProcessStepRunsSelectClient)
        .from("process_step_runs")
        .select(
          `
          id,
          status,
          captured_data,
          process_steps (
            is_final_step,
            process_phase_id,
            process_phases ( id, name_he, name_en ),
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

      const row = data as {
        status?: string;
        captured_data?: Record<string, unknown>;
        process_steps: {
          is_final_step?: boolean;
          process_phase_id: string;
          process_phases: { id: string; name_he?: string; name_en?: string } | null;
          parameterization: Record<string, unknown> | null;
          step_definitions: {
            name_he: string;
            name_en: string;
            input_mode: string;
            schema: Record<string, unknown>;
          } | null;
        } | null;
      };

      const ps = row.process_steps;

      const sd = ps?.step_definitions;
      if (!sd?.schema) {
        toast.error(t("common.error"));
        setLoading(false);
        return;
      }

      setIsFinalStep(!!ps?.is_final_step);
      setSchema(sd.schema as Record<string, unknown>);
      setInputMode(sd.input_mode || "single_form");
      setParameterization(ps?.parameterization || null);
      setTitle(lang === "he" ? sd.name_he : sd.name_en);
      setPhaseTitle(
        lang === "he"
          ? ps?.process_phases?.name_he || ""
          : ps?.process_phases?.name_en || "",
      );
      const cap = row.captured_data || {};
      const fd = pickFieldDefaults(ps?.parameterization);
      const rawSchema = sd.schema as { input_mode?: string; fields?: unknown[]; columns?: unknown[] };
      const mode = rawSchema.input_mode || sd.input_mode || "single_form";

      if (mode === "matrix") {
        const columns = asFieldList(rawSchema.columns);
        const rowsRaw = cap.rows;
        const rows = Array.isArray(rowsRaw) ? rowsRaw : [];
        if (rows.length > 0) {
          const { rows: merged } = mergeMatrixRowsInitial(cap, fd, columns);
          setInitial({ rows: merged });
        } else {
          setInitial({});
        }
      } else {
        setInitial(mergeFlatStepInitial(cap, fd, asFieldList(rawSchema.fields)));
      }

      const rowStatus = row.status;
      if (rowStatus === "completed") {
        clearLastOpenedStep(tenantId, runId);
      } else if (processDefinitionId && runId && stepRunId) {
        writeLastOpenedStep(tenantId, runId, {
          processDefinitionId,
          phaseId: phaseIdFromProcessSteps(stepRunId, ps),
          stepRunId,
        });
      }

      setLoading(false);
    })();
  }, [stepRunId, tenantId, lang, t, processDefinitionId, runId]);

  async function handleSave(payload: Record<string, unknown>, meta?: StepFormSubmitMeta) {
    if (!stepRunId || !tenantId || !runId) return;
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

    if (!(await applyNameSignatureUploads(finalPayload, meta))) return;

    const { error } = await (supabase as unknown as ProcessStepRunsUpdateClient)
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

    if (isFinalStep) {
      toast.success(t("process.runCompletedToast"));
      try {
        await downloadRunSummaryPdf(supabase, { processRunId: runId, lang });
      } catch (e) {
        console.error(e);
        toast.error(t("process.pdfDownloadFailed"));
      }
    } else {
      toast.success(t("process.stepSaved"));
    }

    clearLastOpenedStep(tenantId, runId);
    navigate(stepsListPath);
  }

  async function handleMatrixSaveAndAddRow(
    payload: Record<string, unknown>,
    meta?: StepFormSubmitMeta,
  ) {
    if (!stepRunId || !tenantId) return;
    const finalPayload = { ...payload };
    if (!(await applyNameSignatureUploads(finalPayload, meta))) return;

    const { error } = await (supabase as unknown as ProcessStepRunsUpdateClient)
      .from("process_step_runs")
      .update({
        captured_data: finalPayload,
        status: "in_progress",
        completed_at: null,
      })
      .eq("id", stepRunId)
      .eq("tenant_id", tenantId);

    if (error) {
      toast.error(t("common.error"));
      throw error;
    }
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

  const processFieldDefaults = pickFieldDefaults(parameterization);
  const navigateFromHierarchy = (to: string) => {
    if (to === runPhasesPath) {
      navigate(to, { state: { skipResume: true } });
      return;
    }
    navigate(to);
  };

  return (
    <div className="space-y-4 py-4">
      <HierarchyNavBar
        backTo={mode === "matrix" ? undefined : stepsListPath}
        backLabel={t("common.back")}
        onNavigate={navigateFromHierarchy}
        items={[
          { label: t("process.runPhases"), to: runPhasesPath },
          { label: phaseTitle || t("process.runSteps"), to: stepsListPath },
          { label: title, current: true },
        ]}
      />
      <h2 className="text-xl font-bold font-display">{title}</h2>

      <DynamicStepForm
        schema={mergedSchema as Parameters<typeof DynamicStepForm>[0]["schema"]}
        parameterization={parameterization}
        processFieldDefaults={processFieldDefaults ?? null}
        initialData={initial}
        onSubmit={handleSave}
        submitLabel={isFinalStep ? t("process.submitFinalStep") : t("common.save")}
        noticeBanner={isFinalStep ? t("process.finalStepNotice") : null}
        onBack={() => navigate(stepsListPath)}
        onSaveAndAddRow={mode === "matrix" ? handleMatrixSaveAndAddRow : undefined}
      />
    </div>
  );
}
