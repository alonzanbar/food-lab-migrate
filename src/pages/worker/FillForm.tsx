import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { translateSelectOptionLabel } from "@/i18n/processSelectOptions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowRight, Camera, X, ImageIcon, Upload } from "lucide-react";

interface FormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
  default_value?: unknown;
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
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetch = async () => {
      if (!tenantId) {
        navigate("/worker");
        return;
      }
      const { data } = await supabase
        .from("forms")
        .select("*")
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .eq("status", "active")
        .single();
      if (!data) {
        navigate("/worker");
        return;
      }
      setForm(data as any);
      const today = new Date().toISOString().split("T")[0];
      const defaults: Record<string, any> = {};
      (data.extracted_schema as any)?.fields?.forEach((f: FormField) => {
        defaults[f.id] =
          f.default_value !== undefined
            ? f.default_value
            : f.type === "boolean"
              ? false
              : f.type === "date"
                ? today
                : f.type === "time"
                  ? new Date().toTimeString().slice(0, 5)
                  : "";
      });
      setValues(defaults);
      setLoading(false);
    };
    fetch();
  }, [id, tenantId, navigate]);

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newImages = [...images, ...files];
    setImages(newImages);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreviews(prev => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (submissionId: string): Promise<string[]> => {
    const urls: string[] = [];
    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${tenantId}/${submissionId}/${i}_${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("submission-images")
        .upload(path, file);
      if (error) {
        console.error("Image upload error:", error);
        continue;
      }
      const { data: urlData } = supabase.storage
        .from("submission-images")
        .getPublicUrl(path);
      urls.push(urlData.publicUrl);
    }
    return urls;
  };

  const handleSubmit = async () => {
    if (!form || !user || !tenantId) return;

    const fields = form.extracted_schema?.fields || [];
    for (const field of fields) {
      if (field.required && !values[field.id] && values[field.id] !== false && values[field.id] !== 0) {
        toast.error(`${field.label} - ${t("common.required")}`);
        return;
      }
    }

    setSubmitting(true);
    const payload: Record<string, any> = {};
    fields.forEach(f => {
      payload[f.label] = values[f.id];
    });

    // Generate submission ID upfront so we can use it for image paths
    const submissionId = crypto.randomUUID();

    // Upload images first
    if (images.length > 0) {
      const imageUrls = await uploadImages(submissionId);
      if (imageUrls.length > 0) {
        payload["__images"] = imageUrls;
      }
    }

    const { error } = await supabase
      .from("form_submissions")
      .insert({
        id: submissionId,
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
              <option key={opt} value={opt}>
                {translateSelectOptionLabel(opt, t)}
              </option>
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

      {/* Image upload section */}
      <div className="space-y-3 border border-border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            {t("worker.attachImages")}
          </Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => cameraInputRef.current?.click()}
              className="gap-1"
            >
              <Camera className="w-4 h-4" />
              {t("worker.takePhoto")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-1"
            >
              <Upload className="w-4 h-4" />
              {t("worker.addPhoto")}
            </Button>
          </div>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageAdd}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageAdd}
            className="hidden"
          />
        </div>

        {imagePreviews.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {imagePreviews.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {imagePreviews.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">
            {t("worker.noImagesAttached")}
          </p>
        )}
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
