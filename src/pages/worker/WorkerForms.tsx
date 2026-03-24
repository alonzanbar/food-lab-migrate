import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { FileText, ChevronLeft, GitBranch } from "lucide-react";

interface Form {
  id: string;
  name: string;
  extracted_schema: { fields: any[] } | null;
}

export default function WorkerForms() {
  const { tenantId } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!tenantId) return;
      const { data } = await supabase
        .from("forms")
        .select("id, name, extracted_schema")
        .eq("tenant_id", tenantId)
        .eq("status", "active")
        .order("name");
      setForms((data as any) || []);
      setLoading(false);
    };
    fetch();
  }, [tenantId]);

  if (loading) return <div className="text-center py-12 text-muted-foreground">{t("common.loading")}</div>;

  return (
    <div className="space-y-4 py-4">
      <h2 className="text-xl font-bold font-display">{t("worker.title")}</h2>

      <button
        type="button"
        onClick={() => navigate("/worker/processes")}
        className="w-full bg-accent/10 border border-accent/30 rounded-xl p-4 flex items-center justify-between text-start hover:bg-accent/15 transition-colors"
      >
        <span className="flex items-center gap-3">
          <GitBranch className="w-5 h-5 text-accent shrink-0" />
          <span className="font-semibold text-accent">{t("worker.productionProcesses")}</span>
        </span>
        <ChevronLeft className="w-5 h-5 text-accent rtl:rotate-180" />
      </button>

      {forms.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg text-muted-foreground">{t("worker.noActiveForms")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {forms.map(form => (
            <button
              key={form.id}
              onClick={() => navigate(`/worker/forms/${form.id}`)}
              className="w-full bg-card border border-border rounded-xl p-5 flex items-center justify-between active:bg-muted transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-accent" />
                </div>
                <div className="text-start">
                  <p className="font-semibold text-lg">{form.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {form.extracted_schema?.fields?.length || 0} {t("forms.fields")}
                  </p>
                </div>
              </div>
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
