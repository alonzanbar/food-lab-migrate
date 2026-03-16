import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, FileText, Eye } from "lucide-react";
import { toast } from "sonner";

interface Form {
  id: string;
  name: string;
  status: string;
  source_file_name: string | null;
  created_at: string;
  extracted_schema: any;
}

export default function FormsList() {
  const { tenantId } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchForms = async () => {
    if (!tenantId) return;
    const { data, error } = await supabase
      .from("forms")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
    } else {
      setForms(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchForms(); }, [tenantId]);

  const toggleStatus = async (form: Form) => {
    const newStatus = form.status === "active" ? "inactive" : "active";
    const { error } = await supabase
      .from("forms")
      .update({ status: newStatus })
      .eq("id", form.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(newStatus === "active" ? t("forms.activateSuccess") : t("forms.deactivateSuccess"));
      fetchForms();
    }
  };

  const statusClass = (status: string) => {
    switch (status) {
      case "active": return "status-active";
      case "inactive": return "status-inactive";
      case "processing": return "status-processing";
      default: return "status-draft";
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "active": return t("forms.active");
      case "inactive": return t("forms.inactive");
      case "processing": return t("forms.processingStatus");
      default: return t("forms.draft");
    }
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">{t("common.loading")}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-display">{t("forms.title")}</h2>
        <Button onClick={() => navigate("/admin/forms/upload")} className="gap-2">
          <Plus className="w-4 h-4" />
          {t("forms.upload")}
        </Button>
      </div>

      {forms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">{t("forms.noForms")}</p>
            <p className="text-muted-foreground">{t("forms.uploadFirst")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-start p-4 text-sm font-medium text-muted-foreground">{t("common.name")}</th>
                <th className="text-start p-4 text-sm font-medium text-muted-foreground">{t("common.status")}</th>
                <th className="text-start p-4 text-sm font-medium text-muted-foreground">{t("forms.fields")}</th>
                <th className="text-start p-4 text-sm font-medium text-muted-foreground">{t("forms.createdAt")}</th>
                <th className="text-start p-4 text-sm font-medium text-muted-foreground">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {forms.map(form => (
                <tr key={form.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium">{form.name}</td>
                  <td className="p-4">
                    <span className={statusClass(form.status)}>{statusLabel(form.status)}</span>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {form.extracted_schema?.fields?.length || 0}
                  </td>
                  <td className="p-4 text-muted-foreground text-sm" dir="ltr">
                    {new Date(form.created_at).toLocaleDateString("he-IL")}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/forms/${form.id}`)}
                      >
                        <Eye className="w-4 h-4 me-1" />
                        {t("forms.review")}
                      </Button>
                      {(form.status === "active" || form.status === "inactive" || form.status === "draft") && (
                        <Button
                          variant={form.status === "active" ? "outline" : "default"}
                          size="sm"
                          onClick={() => toggleStatus(form)}
                        >
                          {form.status === "active" ? t("forms.deactivate") : t("forms.activate")}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
