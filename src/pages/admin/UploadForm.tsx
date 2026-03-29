import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { viteSupabaseProjectOrigin } from "@/integrations/supabase/projectUrl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Sparkles, FileText } from "lucide-react";
import { toast } from "sonner";

export default function UploadForm() {
  const { tenantId, user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formName, setFormName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !formName || !tenantId || !user) return;

    setUploading(true);
    try {
      // 1. Upload file to storage
      setProcessingStatus(t("forms.uploadingFile"));
      const safeFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const filePath = `${tenantId}/${safeFileName}`;
      const { error: uploadError } = await supabase.storage
        .from("form-uploads")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("form-uploads")
        .getPublicUrl(filePath);

      // 2. Create form record with processing status
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

      // 3. Call AI extraction edge function
      setProcessingStatus(t("forms.extractingFields"));

      // Ensure the edge function invocation includes the current user's JWT.
      // Without this, Supabase Functions may respond with 401 even if the user is logged in.
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      let session = initialSession;
      let accessToken = session?.access_token;

      const normalizeAccessToken = (token: string) => {
        // Access tokens should be JWTs (3 dot-separated base64url parts).
        // In case the token was stored with quotes/whitespace, normalize it.
        const trimmed = token.trim();
        const unquoted = trimmed.replace(/^"(.*)"$/, "$1");
        return unquoted;
      };

      // Refresh the session immediately before invoking the Edge Function.
      // This helps when the stored access token is stale/expired or minted for a previous project.
      if (session) {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.warn("[UploadForm] refreshSession failed:", refreshError);
        } else {
          session = refreshData.session ?? session;
          accessToken = session?.access_token;
        }
      }

      const normalizedAccessToken = accessToken ? normalizeAccessToken(accessToken) : undefined;

      const decodeJwtPayload = (token: string) => {
        try {
          const [, payloadB64] = token.split(".");
          if (!payloadB64) return null;
          const base64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
          const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
          const json = atob(padded);
          return JSON.parse(json);
        } catch {
          return null;
        }
      };

      const jwtMeta = normalizedAccessToken ? decodeJwtPayload(normalizedAccessToken) : null;

      const tokenMeta = normalizedAccessToken
        ? {
            tokenLen: normalizedAccessToken.length,
            dotParts: normalizedAccessToken.split(".").length,
            hasWhitespace: /\s/.test(normalizedAccessToken),
            hasQuotes: /^".*"$/.test(normalizedAccessToken),
          }
        : { tokenLen: 0, dotParts: 0, hasWhitespace: false, hasQuotes: false };

      const apiOrigin = viteSupabaseProjectOrigin();
      console.log("[UploadForm] Edge function auth metadata", {
        hasAccessToken: !!normalizedAccessToken,
        hasSession: !!session,
        jwtIss: jwtMeta?.iss ?? null,
        jwtExp: jwtMeta?.exp ?? null,
        tokenMeta,
        expectedIss: apiOrigin ? `${apiOrigin}/auth/v1` : null,
      });

      // #region debug: edge function auth injection (no secrets)
      console.log("[UploadForm] Setting Supabase Functions auth", {
        hasAccessToken: !!accessToken,
        hasSession: !!session,
      });
      // #endregion

      // IMPORTANT:
      // `supabase.functions` is a getter that creates a new client instance each time.
      // We must set auth and invoke on the same instance, otherwise the Authorization header
      // won't be included and the function returns 401.
      const functions = supabase.functions;
      if (normalizedAccessToken) functions.setAuth(normalizedAccessToken);

      const { data: extractionData, error: fnError } = await functions.invoke(
        "extract-form-schema",
        {
          ...(normalizedAccessToken
            ? { headers: { Authorization: `Bearer ${normalizedAccessToken}` } }
            : {}),
          body: { file_path: filePath, file_name: file.name },
        }
      );

      if (fnError) {
        const body = typeof fnError === "object" ? (fnError as any)?.context?.body : undefined;
        const message = (fnError as any)?.message;

        let bodySnippet = "";
        if (typeof body === "string") bodySnippet = body.slice(0, 200);
        else bodySnippet = body ? String(body).slice(0, 200) : "";

        // Avoid crashing on non-JSON bodies (like the gateway's "Invalid JWT" payload).
        let errorMsg = "";
        if (typeof body === "string") {
          try {
            const parsed = JSON.parse(body);
            errorMsg = parsed?.error ?? parsed?.message ?? bodySnippet;
          } catch {
            errorMsg = bodySnippet || message || "AI extraction failed";
          }
        } else {
          errorMsg = message || "AI extraction failed";
        }

        console.error("[UploadForm] Edge function failed", {
          status: (fnError as any)?.context?.status_code ?? null,
          bodySnippet,
          errorMsg,
        });
        throw new Error(errorMsg);
      }
      if (extractionData?.error) throw new Error(extractionData.error);

      // 4. Update form with extracted schema
      setProcessingStatus(t("forms.savingResults"));
      const schema = { fields: extractionData.fields || [] };
      const { error: updateError } = await supabase
        .from("forms")
        .update({
          extracted_schema: schema as any,
          extraction_result: {
            raw: extractionData,
            metadata: extractionData.metadata,
            processed_at: new Date().toISOString(),
            source: "lovable_ai",
          } as any,
          status: "draft",
        })
        .eq("id", form.id)
        .eq("tenant_id", tenantId);
      if (updateError) throw updateError;

      toast.success(t("forms.uploadSuccess"));
      navigate(`/admin/forms/${form.id}`);
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.message || t("common.error"));
    } finally {
      setUploading(false);
      setProcessing(false);
      setProcessingStatus("");
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
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="w-8 h-8 text-accent" />
                    <div className="text-start">
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">{t("forms.dragToUpload")}</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, DOCX</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx"
                onChange={e => setFile(e.target.files?.[0] || null)}
              />
            </div>

            <Button type="submit" className="w-full h-12 text-base" disabled={uploading || processing || !file || !formName}>
              {processing ? (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                  {processingStatus || t("forms.processing")}
                </span>
              ) : uploading ? (
                <span className="flex items-center gap-2">
                  <Upload className="w-5 h-5 animate-pulse" />
                  {t("forms.uploading")}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  {t("forms.uploadAndExtract")}
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
