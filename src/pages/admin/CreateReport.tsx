import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function CreateReport() {
  const { tenantId, user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [forms, setForms] = useState<{ id: string; name: string }[]>([]);
  const [name, setName] = useState("");
  const [formId, setFormId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchForms = async () => {
      if (!tenantId) return;
      const { data } = await supabase
        .from("forms")
        .select("id, name")
        .eq("tenant_id", tenantId);
      setForms(data || []);
    };
    fetchForms();
  }, [tenantId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("reports")
      .insert({
        tenant_id: tenantId,
        name,
        form_id: formId || null,
        date_from: dateFrom || null,
        date_to: dateTo || null,
        created_by: user.id,
      })
      .select()
      .single();
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t("reports.createSuccess"));
      navigate(`/admin/reports/${data.id}`);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/admin/reports")}>{t("common.back")}</Button>
        <h2 className="text-2xl font-bold font-display">{t("reports.create")}</h2>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("reports.reportName")}</Label>
              <Input value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>{t("reports.formName")}</Label>
              <select
                value={formId}
                onChange={e => setFormId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">-- {t("reports.formName")} --</option>
                {forms.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("reports.dateFrom")}</Label>
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>{t("reports.dateTo")}</Label>
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} dir="ltr" />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading || !name}>
              {loading ? t("common.loading") : t("reports.create")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
