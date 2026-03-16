import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import mammoth from "npm:mammoth@1.8.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VISUAL_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

const DOC_TYPES = new Set(["docx"]);

const systemPrompt = `You are a form extraction AI for food factory quality control forms.
You analyze uploaded factory documents (forms, checklists, tables) and extract all fillable fields.

For each field, provide:
- id: a unique snake_case identifier
- label: the Hebrew label as shown in the form
- type: one of "text", "number", "boolean", "date", "textarea", "select"
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
    function: {
      name: "extract_form_schema",
      description: "Extract structured form schema from a factory document",
      parameters: {
        type: "object",
        properties: {
          metadata: {
            type: "object",
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
              properties: {
                id: { type: "string" },
                label: { type: "string" },
                type: { type: "string", enum: ["text", "number", "boolean", "date", "textarea", "select"] },
                required: { type: "boolean" },
                options: { type: "array", items: { type: "string" } },
                semantic: {
                  type: "object",
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
  },
];

function buildVisualMessages(fileName: string, mimeType: string, base64: string) {
  return [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `Please analyze this factory form document (${fileName}) and extract all fillable fields with their semantic metadata. The form is in Hebrew.`,
        },
        {
          type: "image_url",
          image_url: { url: `data:${mimeType};base64,${base64}` },
        },
      ],
    },
  ];
}

function buildTextMessages(fileName: string, htmlContent: string) {
  return [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `Please analyze this factory form document (${fileName}) and extract all fillable fields with their semantic metadata. The form is in Hebrew.\n\nDocument content:\n\n${htmlContent}`,
    },
  ];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase configuration");
    }

    const { file_path, file_name } = await req.json();
    if (!file_path) throw new Error("file_path is required");

    const ext = (file_name || file_path).split(".").pop()?.toLowerCase() || "";
    const isVisual = !!VISUAL_TYPES[ext];
    const isDoc = DOC_TYPES.has(ext);

    if (!isVisual && !isDoc) {
      return new Response(
        JSON.stringify({ error: `Unsupported file type: .${ext}. Please upload PDF, DOC, DOCX, JPG, or PNG files.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: fileData, error: downloadError } = await supabase.storage
      .from("form-uploads")
      .download(file_path);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    const arrayBuffer = await fileData.arrayBuffer();
    let messages: any[];

    if (isDoc) {
      // Extract HTML from DOC/DOCX using mammoth
      console.log(`Converting ${ext} to HTML using mammoth...`);
      const result = await mammoth.convertToHtml({ buffer: new Uint8Array(arrayBuffer) });
      if (result.messages?.length) {
        console.log("Mammoth warnings:", result.messages);
      }
      if (!result.value || result.value.trim().length === 0) {
        throw new Error("Could not extract text from the document. The file may be empty or corrupted.");
      }
      messages = buildTextMessages(file_name || "uploaded file", result.value);
    } else {
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );
      messages = buildVisualMessages(file_name || "uploaded file", VISUAL_TYPES[ext], base64);
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        tools: extractionTools,
        tool_choice: { type: "function", function: { name: "extract_form_schema" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
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

    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      const content = aiResult.choices?.[0]?.message?.content;
      console.error("No tool call in response, content:", content);
      throw new Error("AI did not return structured data");
    }

    const extracted = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, ...extracted }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("extract-form-schema error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
