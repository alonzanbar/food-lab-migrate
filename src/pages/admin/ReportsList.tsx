import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, BarChart3, Eye } from "lucide-react";

interface Report {
  id: string;
  name: string;
  form_id: string;
  date_from: string | null;
  date_to: string | null;
  created_at: string;
  forms?: { name: string };
}

export default function ReportsList() {
  const { tenantId } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!tenantId) return;
      const { data } = await supabase
        .from("reports")
        .select("*, forms(name)")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });
      setReports(data || []);
      setLoading(false);
    };
    fetch();
  }, [tenantId]);

  if (loading) return <div className="text-center py-12 text-muted-foreground">{t("common.loading")}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-display">{t("reports.title")}</h2>
        <Button onClick={() => navigate("/admin/reports/create")} className="gap-2">
          <Plus className="w-4 h-4" />
          {t("reports.create")}
        </Button>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">{t("reports.noReports")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-start p-4 text-sm font-medium text-muted-foreground">{t("reports.reportName")}</th>
                <th className="text-start p-4 text-sm font-medium text-muted-foreground">{t("reports.formName")}</th>
                <th className="text-start p-4 text-sm font-medium text-muted-foreground">{t("reports.dateFrom")}</th>
                <th className="text-start p-4 text-sm font-medium text-muted-foreground">{t("reports.dateTo")}</th>
                <th className="text-start p-4 text-sm font-medium text-muted-foreground">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(report => (
                <tr key={report.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium">{report.name}</td>
                  <td className="p-4 text-muted-foreground">{(report as any).forms?.name || "-"}</td>
                  <td className="p-4 text-muted-foreground text-sm" dir="ltr">{report.date_from || "-"}</td>
                  <td className="p-4 text-muted-foreground text-sm" dir="ltr">{report.date_to || "-"}</td>
                  <td className="p-4">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/admin/reports/${report.id}`)}>
                      <Eye className="w-4 h-4 me-1" />
                      {t("reports.viewResults")}
                    </Button>
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
