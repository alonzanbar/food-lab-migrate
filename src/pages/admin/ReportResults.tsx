import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface Report {
  id: string;
  name: string;
  form_id: string | null;
  date_from: string | null;
  date_to: string | null;
  forms?: { name: string };
}

interface Submission {
  id: string;
  submitted_at: string;
  submitted_by: string;
  payload: any;
  profiles?: { full_name: string };
}

export default function ReportResults() {
  const { id } = useParams<{ id: string }>();
  const { tenantId } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      if (!tenantId) {
        navigate("/admin/reports");
        return;
      }
      const { data: reportData } = await supabase
        .from("reports")
        .select("*, forms(name)")
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .single();
      if (!reportData) {
        navigate("/admin/reports");
        return;
      }
      setReport(reportData as any);

      // Fetch matching submissions
      let query = supabase
        .from("form_submissions")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("submitted_at", { ascending: false });

      if (reportData.form_id) query = query.eq("form_id", reportData.form_id);
      if (reportData.date_from) query = query.gte("submitted_at", reportData.date_from);
      if (reportData.date_to) query = query.lte("submitted_at", reportData.date_to + "T23:59:59");

      const { data: subs } = await query;
      const submissions = (subs as any) || [];

      // Fetch profile names for submitters
      const userIds: string[] = submissions.map((s: any) => s.submitted_by).filter((x: any): x is string => typeof x === "string");
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds as string[]);
        const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p.full_name]));
        submissions.forEach((s: any) => {
          s.profiles = { full_name: profileMap[s.submitted_by] || null };
        });
      }

      setSubmissions(submissions);
      setLoading(false);
    };
    fetchReport();
  }, [id, tenantId, navigate]);

  if (loading) return <div className="text-center py-12 text-muted-foreground">{t("common.loading")}</div>;
  if (!report) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/admin/reports")}>{t("common.back")}</Button>
        <div>
          <h2 className="text-2xl font-bold font-display">{report.name}</h2>
          <p className="text-sm text-muted-foreground">
            {(report as any).forms?.name}
            {report.date_from && ` | ${report.date_from}`}
            {report.date_to && ` → ${report.date_to}`}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("reports.submissions")} ({submissions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t("reports.noSubmissions")}</p>
          ) : (
            <div className="space-y-4">
              {submissions.map(sub => (
                <div key={sub.id} className="border border-border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium">{(sub as any).profiles?.full_name || t("common.noData")}</span>
                    <span className="text-sm text-muted-foreground" dir="ltr">
                      {new Date(sub.submitted_at).toLocaleString("he-IL")}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(sub.payload || {})
                      .filter(([key]) => key !== "__images")
                      .map(([key, value]) => (
                        <div key={key} className="bg-muted/50 rounded p-2">
                          <span className="text-xs text-muted-foreground block">{key}</span>
                          <span className="text-sm font-medium">{String(value)}</span>
                        </div>
                      ))}
                  </div>
                  {sub.payload?.__images && Array.isArray(sub.payload.__images) && (
                    <div className="mt-3 flex gap-2 flex-wrap">
                      {sub.payload.__images.map((url: string, i: number) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                          <img
                            src={url}
                            alt={`Photo ${i + 1}`}
                            className="w-20 h-20 object-cover rounded-lg border border-border hover:opacity-80 transition"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
