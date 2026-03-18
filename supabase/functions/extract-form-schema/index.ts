import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
// Use an ESM CDN import (esm.sh) so Deno/Supabase Edge Functions can resolve it without relying on `npm:` type resolution.

// #region TypeScript Deno global
// This file runs on Supabase Edge (Deno), but the repository TypeScript tooling may be using a Node/DOM
// environment that doesn't define the global `Deno` symbol, causing TS to report "Cannot find name 'Deno'".
declare const Deno: {
  env: {
    get: (key: string) => string | undefined;
  };
};
// #endregion

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPPORTED_EXTS = new Set(["pdf", "docx"]);

function getMimeTypeFromExt(ext: string) {
  switch (ext) {
    case "pdf":
      return "application/pdf";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    default:
      return "application/octet-stream";
  }
}

const systemPrompt = `You are a form extraction AI for food factory quality control forms.
You analyze uploaded factory documents (forms, checklists, tables) and extract all fillable fields.

For each field, provide:
- id: a unique snake_case identifier
- label: the Hebrew label as shown in the form
- type: one of "text", "number", "boolean", "date", "time", "textarea", "select"
Important: If a field label contains words like "שעה", "שעת", "hour", "time", or similar time-related terms, set its type to "time".
- required: whether the field appears mandatory
- options: for select fields, list the options if visible
- semantic: object with:
  - concept: canonical English concept name (e.g. "temperature", "worker_name", "inspection_date")
  - value_type: the data type
  - unit: measurement unit if applicable (e.g. "celsius", "percent"), null otherwise
  - process_step: the process context (e.g. "cooling", "storage", "quality_check"), null if generic
  - confidence: your confidence 0.0-1.0 in this extraction

Also extract form metadata:
- title: the form title in Hebrew
- form_number: any form number/code visible
- type: form type if identifiable (e.g. "CCP", "checklist", "log")

Return the extracted data as a structured response.`;

const extractionTools = [
  {
    type: "function",
    name: "extract_form_schema",
    description: "Extract structured form schema from a factory document",
    strict: true,
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        metadata: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string", description: "Form title in Hebrew" },
            form_number: { type: "string", description: "Form number/code" },
            type: { type: "string", description: "Form type (CCP, checklist, log, etc.)" },
          },
          required: ["title"],
        },
        fields: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              id: { type: "string" },
              label: { type: "string" },
              type: {
                type: "string",
                enum: ["text", "number", "boolean", "date", "time", "textarea", "select"],
              },
              required: { type: "boolean" },
              options: { type: "array", items: { type: "string" } },
              semantic: {
                type: "object",
                additionalProperties: false,
                properties: {
                  concept: { type: "string" },
                  value_type: { type: "string" },
                  unit: { type: "string" },
                  process_step: { type: "string" },
                  confidence: { type: "number" },
                },
                required: ["concept", "value_type", "confidence"],
              },
            },
            required: ["id", "label", "type", "required", "semantic"],
          },
        },
      },
      required: ["metadata", "fields"],
    },
  },
];

async function uploadFileToOpenAI(
  openAiApiKey: string,
  arrayBuffer: ArrayBuffer,
  mimeType: string,
  fileName: string,
) {
  const blob = new Blob([arrayBuffer], { type: mimeType });
  const formData = new FormData();

  // Use `user_data` so the file can be used as a model input (`input_file`).
  // Purpose value can vary, but `user_data` is the recommended one for model inputs.
  formData.append("purpose", "user_data");
  formData.append("file", blob, fileName);

  const uploadResp = await fetch("https://api.openai.com/v1/files", {
    method: "POST",
    headers: { Authorization: `Bearer ${openAiApiKey}` },
    body: formData,
  });

  const uploadJson = await uploadResp.json().catch(() => null);
  if (!uploadResp.ok || !uploadJson?.id) {
    const openAiError =
      uploadJson?.error?.message ?? uploadJson?.error ?? uploadResp.status;
    throw new Error(`OpenAI file upload failed: ${openAiError}`);
  }

  return uploadJson.id as string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase configuration");
    }

    const authorizationHeader =
      req.headers.get("Authorization") || req.headers.get("authorization") || "";

    // #region debug: edge function entry (no secrets)
    console.log("[extract-form-schema] handler entry", {
      hasAuthorizationHeader: authorizationHeader.startsWith("Bearer "),
      authHeaderLen: authorizationHeader.length,
      hasOpenAIKey: !!OPENAI_API_KEY,
    });
    // #endregion

    // Manual JWT verification (gateway verification is disabled via --no-verify-jwt).
    // We verify the user token by calling the Supabase Auth "get current user" endpoint.
    if (!authorizationHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing or invalid Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = authorizationHeader.replace(/^Bearer\s+/i, "").trim();
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Missing access token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userResp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_SERVICE_ROLE_KEY,
      },
    });

    console.log("[extract-form-schema] auth user check status", {
      ok: userResp.ok,
      status: userResp.status,
    });

    if (!userResp.ok) {
      // Do not leak token details.
      return new Response(JSON.stringify({ error: "Invalid JWT" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userJson = await userResp.json();
    const userId = userJson?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Invalid JWT" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[extract-form-schema] authenticated user", {
      userId,
    });

    const { file_path, file_name } = await req.json();
    if (!file_path) throw new Error("file_path is required");

    const ext = (file_name || file_path).split(".").pop()?.toLowerCase() || "";
    const isSupported = SUPPORTED_EXTS.has(ext);

    console.log("[extract-form-schema] request parsed", {
      ext,
      isSupported,
      fileName: file_name ?? null,
      tenantIdFromPath: String(file_path).split("/")[0] ?? null,
    });

    if (!isSupported) {
      return new Response(
        JSON.stringify({
          error: `Unsupported file type: .${ext}. Supported: DOCX, PDF.`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Tenant authorization: file_path starts with `${tenantId}/...`
    const tenantIdFromPath = String(file_path).split("/")[0];
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    console.log("[extract-form-schema] tenant check", {
      tenantIdFromPath,
      profileTenantId: profile?.tenant_id ?? null,
      hasProfile: !!profile,
      profileError: profileError ? profileError.message : null,
      tenantMatch: profile?.tenant_id
        ? String(profile.tenant_id) === tenantIdFromPath
        : false,
    });

    if (profileError || !profile?.tenant_id) {
      return new Response(JSON.stringify({ error: "Unauthorized (missing tenant)" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (String(profile.tenant_id) !== tenantIdFromPath) {
      return new Response(JSON.stringify({ error: "Unauthorized (tenant mismatch)" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[extract-form-schema] downloading from storage", {
      bucket: "form-uploads",
      filePath: file_path,
    });

    const { data: fileData, error: downloadError } = await supabase.storage
      .from("form-uploads")
      .download(file_path);

    if (downloadError || !fileData) {
      console.error("[extract-form-schema] download error", {
        message: downloadError?.message ?? null,
        name: downloadError?.name ?? null,
      });
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    const arrayBuffer = await fileData.arrayBuffer();
    console.log("[extract-form-schema] download complete", {
      bytes: arrayBuffer.byteLength,
    });
    const mimeType = getMimeTypeFromExt(ext);
    const uploadFileName = file_name || `uploaded.${ext}`;

    console.log("[extract-form-schema] uploading to OpenAI files", {
      mimeType,
      uploadFileName,
      bytes: arrayBuffer.byteLength,
    });

    const openAiFileId = await uploadFileToOpenAI(
      OPENAI_API_KEY,
      arrayBuffer,
      mimeType,
      uploadFileName,
    );

    console.log("[extract-form-schema] OpenAI file uploaded", {
      fileIdPrefix: openAiFileId.slice(0, 10),
    });

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        instructions: systemPrompt,
        tools: extractionTools,
        tool_choice: { type: "function", name: "extract_form_schema" },
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Please analyze this factory form document (${uploadFileName}) and extract all fillable fields with their semantic metadata. The form is in Hebrew.`,
              },
              {
                type: "input_file",
                file_id: openAiFileId,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    console.log("AI result:", JSON.stringify(aiResult));

    const fnCall = aiResult.output?.find(
      (item: any) =>
        item?.type === "function_call" &&
        item?.name === "extract_form_schema" &&
        typeof item?.arguments === "string",
    );

    if (!fnCall?.arguments) {
      console.error("No function_call in OpenAI response output", {
        output: aiResult.output,
        outputText: aiResult.output_text ?? null,
      });
      throw new Error("AI did not return function_call arguments");
    }

    const extracted = JSON.parse(fnCall.arguments);

    return new Response(JSON.stringify({ success: true, ...extracted }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("extract-form-schema error:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
    });
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
