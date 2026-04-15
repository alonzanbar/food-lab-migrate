import type { SupabaseClient } from "@supabase/supabase-js";
import { viteSupabaseProjectOrigin } from "@/integrations/supabase/projectUrl";

export type RunSummaryPdfLang = "he" | "en";

/** Calls Edge function (fetch) and triggers a browser download of the PDF. */
export async function downloadRunSummaryPdf(
  client: SupabaseClient,
  params: { processRunId: string; lang: RunSummaryPdfLang },
): Promise<void> {
  const { data: sessionData } = await client.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) {
    throw new Error("Not signed in");
  }

  const origin = viteSupabaseProjectOrigin();
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  if (!origin || !anonKey) {
    throw new Error("Missing Supabase URL or publishable key");
  }

  const url = `${origin.replace(/\/$/, "")}/functions/v1/run-summary-pdf`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: anonKey,
    },
    body: JSON.stringify({ process_run_id: params.processRunId, lang: params.lang }),
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const j = (await res.json()) as { error?: string };
      if (j?.error) detail = j.error;
    } catch {
      try {
        detail = await res.text();
      } catch {
        /* ignore */
      }
    }
    throw new Error(detail || `HTTP ${res.status}`);
  }

  const ct = res.headers.get("Content-Type") || "";
  if (!ct.includes("application/pdf")) {
    throw new Error("Unexpected response type");
  }

  const buf = await res.arrayBuffer();
  if (!buf.byteLength) {
    throw new Error("Empty PDF response");
  }

  const disp = res.headers.get("Content-Disposition");
  let filename = `run-${params.processRunId.replace(/-/g, "").slice(0, 8)}.pdf`;
  const m = disp?.match(/filename="([^"]+)"/);
  if (m?.[1]) filename = m[1];

  const blob = new Blob([buf], { type: "application/pdf" });
  const blobUrl = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}
