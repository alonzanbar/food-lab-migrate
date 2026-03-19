import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, ArrowRight, Save, FileText } from "lucide-react";
import { toast } from "sonner";

interface SemanticInfo {
  concept: string;
  value_type: string;
  unit: string | null;
  process_step: string | null;
  confidence: number;
}

interface FormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
  semantic: SemanticInfo;
}

interface FormData {
  id: string;
  name: string;
  status: string;
  source_file_url: string | null;
  source_file_name: string | null;
  extracted_schema: { fields: FormField[] } | null;
  extraction_result: any;
}

const FIELD_TYPES = ["text", "number", "boolean", "date", "time", "select", "textarea"];

export default function FormReview() {
  const { id } = useParams<{ id: string }>();
  const { tenantId } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      if (!tenantId) {
        navigate("/admin/forms");
        return;
      }
      const { data, error } = await supabase
        .from("forms")
        .select("*")
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .single();
      if (error) {
        toast.error(error.message);
        navigate("/admin/forms");
        return;
      }
      setForm(data as any);
      setFields((data.extracted_schema as any)?.fields || []);
      setLoading(false);
    };
    fetch();
  }, [id, tenantId, navigate]);

  const updateField = (index: number, updates: Partial<FormField>) => {
    setFields(prev => prev.map((f, i) => i === index ? { ...f, ...updates } : f));
  };

  const updateSemantic = (index: number, updates: Partial<SemanticInfo>) => {
    setFields(prev => prev.map((f, i) =>
      i === index ? { ...f, semantic: { ...f.semantic, ...updates } } : f
    ));
  };

  const addField = () => {
    setFields(prev => [...prev, {
      id: `field_${Date.now()}`,
      label: "",
      type: "text",
      required: false,
      semantic: { concept: "", value_type: "text", unit: null, process_step: null, confidence: 1.0 },
    }]);
  };

  const removeField = (index: number) => {
    setFields(prev => prev.filter((_, i) => i !== index));
  };

  const saveSchema = async () => {
    if (!form || !tenantId) return;
    setSaving(true);
    const { error } = await supabase
      .from("forms")
      .update({ extracted_schema: { fields } as any })
      .eq("id", form.id)
      .eq("tenant_id", tenantId);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t("forms.schemaSaved"));
    }
    setSaving(false);
  };

  const toggleStatus = async () => {
    if (!form || !tenantId) return;
    const newStatus = form.status === "active" ? "inactive" : "active";
    const { error } = await supabase
      .from("forms")
      .update({ status: newStatus })
      .eq("id", form.id)
      .eq("tenant_id", tenantId);
    if (error) {
      toast.error(error.message);
    } else {
      setForm(prev => prev ? { ...prev, status: newStatus } : null);
      toast.success(newStatus === "active" ? t("forms.activateSuccess") : t("forms.deactivateSuccess"));
    }
  };

  const fieldTypeLabel = (type: string) => {
    const key = `fieldType.${type}` as any;
    return t(key);
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">{t("common.loading")}</div>;
  if (!form) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/admin/forms")}>{t("common.back")}</Button>
          <div>
            <h2 className="text-2xl font-bold font-display">{form.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={
                form.status === "active" ? "status-active" :
                form.status === "processing" ? "status-processing" :
                form.status === "inactive" ? "status-inactive" : "status-draft"
              }>
                {form.status === "active" ? t("forms.active") :
                 form.status === "processing" ? t("forms.processingStatus") :
                 form.status === "inactive" ? t("forms.inactive") : t("forms.draft")}
              </span>
              {form.source_file_name && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {form.source_file_name}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={toggleStatus}>
            {form.status === "active" ? t("forms.deactivate") : t("forms.activate")}
          </Button>
          <Button onClick={saveSchema} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {t("forms.saveSchema")}
          </Button>
        </div>
      </div>

      {/* Extracted fields */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t("forms.extractedFields")}</h3>
          <Button variant="outline" size="sm" onClick={addField} className="gap-1">
            <Plus className="w-4 h-4" />
            {t("forms.addField")}
          </Button>
        </div>

        {fields.map((field, index) => (
          <Card key={field.id} className="card-hover">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Field config */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label>{t("forms.fieldLabel")}</Label>
                    <Input
                      value={field.label}
                      onChange={e => updateField(index, { label: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>{t("forms.fieldType")}</Label>
                    <select
                      value={field.type}
                      onChange={e => updateField(index, { type: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {FIELD_TYPES.map(ft => (
                        <option key={ft} value={ft}>{fieldTypeLabel(ft)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={field.required}
                      onCheckedChange={v => updateField(index, { required: v })}
                    />
                    <Label>{t("forms.fieldRequired")}</Label>
                  </div>
                </div>

                {/* Semantic info */}
                <div className="space-y-3 border-s border-border ps-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-accent font-medium">{t("forms.semantic")}</Label>
                    {field.semantic.confidence < 0.9 && (
                      <Badge variant="outline" className="text-warning border-warning">
                        {t("forms.confidence")}: {Math.round(field.semantic.confidence * 100)}%
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("forms.concept")}</Label>
                    <Input
                      value={field.semantic.concept}
                      onChange={e => updateSemantic(index, { concept: e.target.value })}
                      className="text-sm"
                      dir="ltr"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">{t("forms.unit")}</Label>
                      <Input
                        value={field.semantic.unit || ""}
                        onChange={e => updateSemantic(index, { unit: e.target.value || null })}
                        className="text-sm"
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t("forms.processStep")}</Label>
                      <Input
                        value={field.semantic.process_step || ""}
                        onChange={e => updateSemantic(index, { process_step: e.target.value || null })}
                        className="text-sm"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeField(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4 me-1" />
                  {t("forms.removeField")}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
