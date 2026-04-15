#!/usr/bin/env -S deno run --allow-net --allow-write --allow-read
/**
 * Generate a sample executive PDF from mock Hebrew run data (no DB).
 * Usage: deno run --allow-net --allow-write --allow-read supabase/functions/run-summary-pdf/sample-cli.ts [out.pdf]
 */
import { createMockRunReport } from "../_shared/runReportModel.ts";
import { generateRunReportPdfBytes } from "./reportLayout.ts";

const outPath = Deno.args[0] ?? "sample-run-report.pdf";
const bytes = await generateRunReportPdfBytes(createMockRunReport());
await Deno.writeFile(outPath, bytes);
console.log(`Wrote ${outPath} (${bytes.byteLength} bytes)`);
