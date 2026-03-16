import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";

interface FormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
}

interface FormData {
  id: string;
  name: string;
  tenant_id: string;
  extracted_schema: { fields: FormField[] } | null;
}

export default function FillForm() {
  const { id } = useParams<{ id: string }>();
  const { user, tenantId } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData | null>(null);
  const [values, setValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("forms")
        .select("*")
        .eq("id", id)
        .eq("status", "active")
        .single();
      if (!data) {
        navigate("/worker");
        return;
      }
      setForm(data as any);
      // Initialize default values
      const today = new Date().toISOString().split("T")[0];
      const defaults: Record<string, any> = {};
      (data.extracted_schema as any)?.fields?.forEach((f: FormField) => {
        defaults[f.id] = f.type === "boolean" ? false : f.type === "date" ? today : "";
      });
      setValues(defaults);
      setLoading(false);
    };
    fetch();
  }, [id]);

  const handleSubmit = async () => {
    if (!form || !user || !tenantId) return;

    // Validate required fields
    const fields = form.extracted_schema?.fields || [];
    for (const field of fields) {
      if (field.required && !values[field.id] && values[field.id] !== false && values[field.id] !== 0) {
        toast.error(`${field.label} - ${t("common.required")}`);
        return;
      }
    }

    setSubmitting(true);
    // Build payload with labels as keys for readability
    const payload: Record<string, any> = {};
    fields.forEach(f => {
      payload[f.label] = values[f.id];
    });

    const { error } = await supabase
      .from("form_submissions")
      .insert({
        tenant_id: tenantId,
        form_id: form.id,
        submitted_by: user.id,
        payload,
      });

    if (error) {
      toast.error(error.message);
      setSubmitting(false);
    } else {
      navigate("/worker/success");
    }
  };

  const updateValue = (fieldId: string, value: any) => {
    setValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const renderField = (field: FormField) => {
    switch (field.type) {
      case "number":
        return (
          <Input
            type="number"
            value={values[field.id] || ""}
            onChange={e => updateValue(field.id, e.target.value)}
            className="text-lg h-14"
            inputMode="numeric"
            dir="ltr"
          />
        );
      case "boolean":
        return (
          <div className="flex items-center gap-4 h-14 bg-card rounded-lg border border-input px-4">
            <Switch
              checked={!!values[field.id]}
              onCheckedChange={v => updateValue(field.id, v)}
              className="scale-125"
            />
            <span className="text-lg">{values[field.id] ? t("common.yes") : t("common.no")}</span>
          </div>
        );
      case "date":
        return (
          <Input
            type="date"
            value={values[field.id] || ""}
            onChange={e => updateValue(field.id, e.target.value)}
            className="text-lg h-14"
            dir="ltr"
          />
        );
      case "time":
        return (
          <Input
            type="time"
            value={values[field.id] || ""}
            onChange={e => updateValue(field.id, e.target.value)}
            className="text-lg h-14"
            dir="ltr"
          />
        );
      case "textarea":
        return (
          <Textarea
            value={values[field.id] || ""}
            onChange={e => updateValue(field.id, e.target.value)}
            className="text-lg min-h-[80px]"
          />
        );
      case "select":
        return (
          <select
            value={values[field.id] || ""}
            onChange={e => updateValue(field.id, e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-4 py-3 text-lg"
          >
            <option value="">--</option>
            {field.options?.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      default:
        return (
          <Input
            type="text"
            value={values[field.id] || ""}
            onChange={e => updateValue(field.id, e.target.value)}
            className="text-lg h-14"
          />
        );
    }
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">{t("common.loading")}</div>;
  if (!form) return null;

  const fields = form.extracted_schema?.fields || [];

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/worker")}
          className="p-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold font-display">{form.name}</h2>
      </div>

      <div className="space-y-5">
        {fields.map(field => (
          <div key={field.id} className="space-y-2">
            <Label className="text-base font-medium">
              {field.label}
              {field.required && <span className="text-destructive ms-1">*</span>}
            </Label>
            {renderField(field)}
          </div>
        ))}
      </div>

      {/* Fixed bottom submit button */}
      <div className="pt-4 pb-8">
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full h-14 text-lg font-semibold"
        >
          {submitting ? t("worker.submitting") : t("worker.submitForm")}
        </Button>
      </div>
    </div>
  );
}
