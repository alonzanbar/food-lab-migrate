import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import type { TranslationKey } from "@/i18n/translations";
import { ProcessDefinitionCard } from "@/components/process";

type ProcessDef = {
  id: string;
  code: string;
  name_he: string;
  name_en: string;
  version: string;
  status: string;
};

type ProcessDefinitionsClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        order: (column: string, opts?: { ascending?: boolean }) => Promise<{
          data: unknown;
          error: { message?: string } | null;
        }>;
      };
    };
  };
};

function statusLabel(status: string, t: (key: TranslationKey) => string) {
  switch (status) {
    case "published":
      return t("admin.processStatusPublished");
    case "draft":
      return t("admin.processStatusDraft");
    case "archived":
      return t("admin.processStatusArchived");
    default:
      return status;
  }
}

export default function AdminProcessesList() {
  const { tenantId } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [items, setItems] = useState<ProcessDef[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!tenantId) return;
      const { data, error } = await (supabase as unknown as ProcessDefinitionsClient)
        .from("process_definitions")
        .select("id, code, name_he, name_en, version, status")
        .eq("tenant_id", tenantId)
        .order("name_he", { ascending: true });

      if (error) {
        console.error(error);
        setItems([]);
      } else {
        setItems((data as ProcessDef[]) || []);
      }
      setLoading(false);
    })();
  }, [tenantId]);

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">{t("common.loading")}</div>;
  }

  return (
    <div className="space-y-4 py-4">
      <div>
        <h2 className="text-2xl font-bold font-display">{t("admin.tenantProcessesTitle")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("admin.processesViewOnlyHint")}</p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">{t("process.noProcesses")}</div>
      ) : (
        <div className="space-y-3">
          {items.map((p) => (
            <ProcessDefinitionCard
              key={p.id}
              title={lang === "he" ? p.name_he : p.name_en}
              subtitle={`${p.code} · v${p.version} · ${statusLabel(p.status, t)}`}
              onClick={() => navigate(`/admin/processes/${p.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
