import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, GitBranch, FileText } from "lucide-react";

type ProcessDef = {
  id: string;
  code: string;
  name_he: string;
  name_en: string;
  version: string;
  status: string;
};

export default function WorkerProcessList() {
  const { tenantId } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [items, setItems] = useState<ProcessDef[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!tenantId) return;
      const { data, error } = await (supabase as any)
        .from("process_definitions")
        .select("id, code, name_he, name_en, version, status")
        .eq("tenant_id", tenantId)
        .eq("status", "published")
        .order("name_he");
      if (!error && data) setItems(data as ProcessDef[]);
      setLoading(false);
    })();
  }, [tenantId]);

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">{t("common.loading")}</div>;
  }

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate("/worker")}
          className="p-2 -ms-2 text-muted-foreground"
          aria-label={t("common.back")}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold font-display">{t("process.listTitle")}</h2>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">{t("process.noProcesses")}</div>
      ) : (
        <div className="space-y-3">
          {items.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => navigate(`/worker/processes/${p.id}`)}
              className="w-full bg-card border border-border rounded-xl p-5 flex items-center justify-between active:bg-muted transition-colors text-start"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <GitBranch className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-lg">{lang === "he" ? p.name_he : p.name_en}</p>
                  <p className="text-sm text-muted-foreground">
                    {p.code} · v{p.version}
                  </p>
                </div>
              </div>
              <ChevronLeft className="w-5 h-5 text-muted-foreground rtl:rotate-180" />
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => navigate("/worker")}
        className="w-full flex items-center justify-center gap-2 py-3 text-muted-foreground border border-dashed rounded-xl"
      >
        <FileText className="w-5 h-5" />
        {t("process.backToForms")}
      </button>
    </div>
  );
}
