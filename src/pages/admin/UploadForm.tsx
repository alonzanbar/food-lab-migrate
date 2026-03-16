import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";
import { toast } from "sonner";

// Mock AI extraction - generates sample schema based on real factory form patterns
function mockExtractSchema(fileName: string) {
  const sampleFields = [
    {
      id: "field_1",
      label: "תאריך",
      type: "date",
      required: true,
      semantic: { concept: "inspection_date", value_type: "date", unit: null, process_step: "cooling_control", confidence: 0.97 },
    },
    {
      id: "field_2",
      label: "שם העובד",
      type: "text",
      required: true,
      semantic: { concept: "worker_name", value_type: "text", unit: null, process_step: null, confidence: 0.95 },
    },
    {
      id: "field_3",
      label: "טמפ׳ במרכז המוצר בכניסה לצ׳ילר",
      type: "number",
      required: true,
      semantic: { concept: "product_core_temp_entry", value_type: "number", unit: "celsius", process_step: "chiller_entry", confidence: 0.91 },
    },
    {
      id: "field_4",
      label: "שעת כניסה לצ׳ילר",
      type: "text",
      required: true,
      semantic: { concept: "chiller_entry_time", value_type: "time", unit: "HH:mm", process_step: "chiller_entry", confidence: 0.93 },
    },
    {
      id: "field_5",
      label: "טמפ׳ יציאה מהצ׳ילר",
      type: "number",
      required: true,
      semantic: { concept: "product_temp_exit", value_type: "number", unit: "celsius", process_step: "chiller_exit", confidence: 0.90 },
    },
    {
      id: "field_6",
      label: "שעת יציאה מהצ׳ילר",
      type: "text",
      required: true,
      semantic: { concept: "chiller_exit_time", value_type: "time", unit: "HH:mm", process_step: "chiller_exit", confidence: 0.92 },
    },
    {
      id: "field_7",
      label: "טמפ׳ במרכז המוצר (עד שעתיים מהכניסה)",
      type: "number",
      required: true,
      semantic: { concept: "product_core_temp_2h", value_type: "number", unit: "celsius", process_step: "cooling_verification", confidence: 0.87 },
    },
    {
      id: "field_8",
      label: "פעולות מתקנות",
      type: "textarea",
      required: false,
      semantic: { concept: "corrective_actions", value_type: "text", unit: null, process_step: "deviation_handling", confidence: 0.89 },
    },
    {
      id: "field_9",
      label: "הערות",
      type: "textarea",
      required: false,
      semantic: { concept: "notes", value_type: "text", unit: null, process_step: null, confidence: 0.94 },
    },
    {
      id: "field_10",
      label: "חתימה",
      type: "text",
      required: true,
      semantic: { concept: "worker_signature", value_type: "text", unit: null, process_step: "approval", confidence: 0.86 },
    },
  ];
  return { fields: sampleFields, source_form: { title: "בקרת צינון מוצר", form_number: "1015", type: "CCP2", last_updated: "03.04.2019" } };
}

export default function UploadForm() {
  const { tenantId, user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formName, setFormName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !formName || !tenantId || !user) return;

    setUploading(true);
    try {
      // Upload file to storage
      const filePath = `${tenantId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("form-uploads")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("form-uploads")
        .getPublicUrl(filePath);

      // Create form record with processing status
      const { data: form, error: insertError } = await supabase
        .from("forms")
        .insert({
          tenant_id: tenantId,
          name: formName,
          status: "processing",
          source_file_url: publicUrl,
          source_file_name: file.name,
          created_by: user.id,
        })
        .select()
        .single();
      if (insertError) throw insertError;

      setUploading(false);
      setProcessing(true);

      // Simulate AI processing delay
      await new Promise(r => setTimeout(r, 2500));

      // Mock extraction result
      const schema = mockExtractSchema(file.name);
      const { error: updateError } = await supabase
        .from("forms")
        .update({
          extracted_schema: schema,
          extraction_result: { raw: schema, processed_at: new Date().toISOString(), source: "ai_mock" },
          status: "draft",
        })
        .eq("id", form.id);
      if (updateError) throw updateError;

      toast.success(t("forms.uploadSuccess"));
      navigate(`/admin/forms/${form.id}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/admin/forms")}>{t("common.back")}</Button>
        <h2 className="text-2xl font-bold font-display">{t("forms.upload")}</h2>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleUpload} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="formName">{t("forms.name")}</Label>
              <Input
                id="formName"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder={t("forms.name")}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>{t("forms.file")}</Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-accent transition-colors"
              >
                <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  {file ? file.name : t("forms.dragToUpload")}
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png"
                onChange={e => setFile(e.target.files?.[0] || null)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={uploading || processing || !file || !formName}>
              {processing ? (
                <span className="flex items-center gap-2">
                  <span className="animate-pulse-slow">●</span>
                  {t("forms.processing")}
                </span>
              ) : uploading ? (
                t("forms.uploading")
              ) : (
                t("forms.upload")
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
