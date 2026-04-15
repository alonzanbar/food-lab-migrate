import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { fetchProcessStepsOrdered } from "@/lib/processRuntime";
import { HierarchyNavBar, PhaseTitleStrip, ProcessStepRow } from "@/components/process";
import { Badge } from "@/components/ui/badge";
import { Circle } from "lucide-react";

type ProcessDef = {
  id: string;
  code: string;
  name_he: string;
  name_en: string;
  version: string;
};

type PhaseRow = {
  id: string;
  order_index: number;
  code: string;
  name_he: string;
  name_en: string;
};

type StepRow = {
  id: string;
  order_index: number;
  name_he: string;
  name_en: string;
  stepCode: string;
  is_final_step: boolean;
};

type ProcessDefLookupClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (c: string, v: string) => {
        eq: (c2: string, v2: string) => {
          maybeSingle: () => Promise<{ data: unknown; error: { message?: string } | null }>;
        };
      };
    };
  };
};

function groupPhasesAndSteps(
  ordered: Awaited<ReturnType<typeof fetchProcessStepsOrdered>>,
): Array<{ phase: PhaseRow; steps: StepRow[] }> {
  const map = new Map<string, { phase: PhaseRow; steps: StepRow[] }>();
  for (const { phase, process_step } of ordered) {
    const ph = phase as PhaseRow;
    const ps = process_step as {
      id: string;
      order_index: number;
      is_final_step?: boolean;
      step_definitions: { code: string; name_he: string; name_en: string } | null;
    };
    let g = map.get(ph.id);
    if (!g) {
      g = { phase: ph, steps: [] };
      map.set(ph.id, g);
    }
    const sd = ps.step_definitions;
    g.steps.push({
      id: ps.id,
      order_index: ps.order_index,
      name_he: sd?.name_he ?? "—",
      name_en: sd?.name_en ?? "—",
      stepCode: sd?.code ?? "",
      is_final_step: !!ps.is_final_step,
    });
  }
  const list = [...map.values()];
  list.sort((a, b) => a.phase.order_index - b.phase.order_index);
  for (const g of list) {
    g.steps.sort((x, y) => x.order_index - y.order_index);
  }
  return list;
}

export default function AdminProcessOutline() {
  const { processDefinitionId } = useParams<{ processDefinitionId: string }>();
  const { tenantId } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [defn, setDefn] = useState<ProcessDef | null>(null);
  const [groups, setGroups] = useState<Array<{ phase: PhaseRow; steps: StepRow[] }>>([]);
  const [loading, setLoading] = useState(true);
  const [missingDef, setMissingDef] = useState(false);
  const [stepsError, setStepsError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!processDefinitionId || !tenantId) {
        setLoading(false);
        return;
      }

      const { data: d, error: de } = await (supabase as unknown as ProcessDefLookupClient)
        .from("process_definitions")
        .select("id, code, name_he, name_en, version")
        .eq("id", processDefinitionId)
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (cancelled) return;
      if (de || !d) {
        setDefn(null);
        setMissingDef(true);
        setLoading(false);
        return;
      }
      setDefn(d as ProcessDef);
      setMissingDef(false);

      try {
        const ordered = await fetchProcessStepsOrdered(supabase, processDefinitionId);
        if (!cancelled) {
          setGroups(groupPhasesAndSteps(ordered));
          setStepsError(false);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setGroups([]);
          setStepsError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [processDefinitionId, tenantId]);

  const title = defn ? (lang === "he" ? defn.name_he : defn.name_en) : "";

  const emptyOutline = useMemo(() => !loading && defn && groups.length === 0 && !stepsError, [loading, defn, groups.length, stepsError]);

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">{t("common.loading")}</div>;
  }

  if (missingDef || !defn) {
    return (
      <div className="space-y-4 py-4">
        <HierarchyNavBar
          backTo="/admin/processes"
          backLabel={t("common.back")}
          onNavigate={navigate}
          items={[
            { label: t("admin.tenantProcessesTitle"), to: "/admin/processes" },
            { label: t("common.noData"), current: true },
          ]}
        />
        <h2 className="text-xl font-bold font-display">{t("common.noData")}</h2>
        <p className="text-sm text-muted-foreground">{t("admin.processOutlineUnavailable")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      <HierarchyNavBar
        backTo="/admin/processes"
        backLabel={t("common.back")}
        onNavigate={navigate}
        items={[
          { label: t("admin.tenantProcessesTitle"), to: "/admin/processes" },
          { label: title, current: true },
        ]}
      />
      <div>
        <h2 className="text-xl font-bold font-display">{title}</h2>
        <p className="text-sm text-muted-foreground">
          {defn.code} · v{defn.version}
        </p>
      </div>

      <p className="text-sm text-muted-foreground">{t("admin.processOutlineReadOnlyHint")}</p>

      {stepsError ? (
        <p className="text-sm text-muted-foreground">{t("admin.processOutlineStepsError")}</p>
      ) : null}

      {emptyOutline ? (
        <p className="text-sm text-muted-foreground">{t("admin.processOutlineEmpty")}</p>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => {
            const phaseTitle = lang === "he" ? g.phase.name_he : g.phase.name_en;
            return (
              <section key={g.phase.id} className="space-y-2">
                <PhaseTitleStrip title={phaseTitle} />
                <ul className="space-y-2 ps-0">
                  {g.steps.map((s) => {
                    const stepName = lang === "he" ? s.name_he : s.name_en;
                    return (
                      <li key={s.id}>
                        <ProcessStepRow
                          leading={<Circle className="h-5 w-5 text-muted-foreground/40" aria-hidden />}
                          title={stepName}
                          subtitle={s.stepCode || undefined}
                          trailing={
                            s.is_final_step ? (
                              <Badge variant="secondary" className="shrink-0">
                                {t("admin.processFinalStepBadge")}
                              </Badge>
                            ) : undefined
                          }
                        />
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
