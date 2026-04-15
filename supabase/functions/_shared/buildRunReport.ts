import { extractMatrixForPdf, flattenCaptured, type Lang } from "./runSummaryPdfFlatten.ts";
import type { MatrixColumnDef, ReportStatus, RunReport, RunReportField, RunReportPhase, RunReportStep } from "./runReportModel.ts";

type Schema = Record<string, unknown>;

export type StepRunInput = {
  status: string;
  captured_data: Record<string, unknown>;
  process_steps: {
    order_index: number;
    process_phase_id: string;
    process_phases: { order_index: number; name_he: string; name_en: string } | null;
    step_definitions: {
      name_he: string;
      name_en: string;
      input_mode: string;
      schema: Record<string, unknown>;
    } | null;
  } | null;
};

export type ProcessRunInput = {
  id: string;
  status: string;
  batch_ref: string | null;
  started_at: string | null;
  completed_at: string | null;
  process_definitions: {
    code: string;
    name_he: string;
    name_en: string;
    version: string;
  } | null;
};

function mapStepStatus(raw: string): ReportStatus {
  if (raw === "failed") return "failed";
  if (raw === "completed" || raw === "skipped") return "completed";
  return "pending";
}

function stepStatusLabel(raw: string, lang: Lang): string {
  if (lang === "en") {
    if (raw === "completed") return "Completed";
    if (raw === "pending") return "Pending";
    if (raw === "in_progress") return "In progress";
    if (raw === "skipped") return "Skipped";
    if (raw === "failed") return "Failed";
    return raw;
  }
  if (raw === "completed") return "הושלם";
  if (raw === "pending") return "ממתין";
  if (raw === "in_progress") return "בביצוע";
  if (raw === "skipped") return "דולג";
  if (raw === "failed") return "נכשל";
  return raw;
}

function phaseStatusFromSteps(steps: RunReportStep[]): ReportStatus {
  if (steps.some((s) => s.status === "failed")) return "failed";
  if (steps.some((s) => s.status === "pending")) return "pending";
  return "completed";
}

function phaseStatusLabel(st: ReportStatus, lang: Lang): string {
  if (lang === "en") {
    if (st === "failed") return "Issues";
    if (st === "pending") return "Open";
    return "Closed";
  }
  if (st === "failed") return "חריגות";
  if (st === "pending") return "פתוח";
  return "סגור";
}

function parseFieldLines(lines: string[]): RunReportField[] {
  const sep = ": ";
  const out: RunReportField[] = [];
  for (const line of lines) {
    const t = line.trim();
    const i = t.indexOf(sep);
    if (i === -1) {
      out.push({ label: "", value: t });
      continue;
    }
    out.push({
      label: t.slice(0, i).trim(),
      value: t.slice(i + sep.length).trim() || null,
    });
  }
  return out;
}

function formatDuration(start: string | null, end: string | null, lang: Lang): string {
  if (!start || !end) return lang === "he" ? "—" : "—";
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return "—";
  const ms = b - a;
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (lang === "he") {
    if (h && m) return `${h} שעות ו־${m} דקות`;
    if (h) return `${h} שעות`;
    return `${m} דקות`;
  }
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

function hebrewPhaseLetter(n: number): string {
  const letters = ["א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט", "י"];
  return letters[n] ?? String(n + 1);
}

function isFinalSummaryStepName(name: string): boolean {
  return /סיכום|סופי|summary|final\s*production/i.test(name);
}

function fieldsFromStepRun(sr: StepRunInput, lang: Lang): RunReportField[] {
  const sd = sr.process_steps?.step_definitions;
  const cap = (sr.captured_data || {}) as Record<string, unknown>;
  const schema = (sd?.schema || null) as Schema | null;
  const inputMode = (sd?.input_mode as string) || "single_form";
  const lines = flattenCaptured(cap, schema, inputMode, lang);
  return parseFieldLines(lines);
}

function matrixFromStep(sr: StepRunInput, lang: Lang): RunReportStep["matrix"] {
  const sd = sr.process_steps?.step_definitions;
  const cap = (sr.captured_data || {}) as Record<string, unknown>;
  const schema = (sd?.schema || null) as Schema | null;
  const inputMode = (sd?.input_mode as string) || "single_form";
  const m = extractMatrixForPdf(cap, schema, inputMode);
  if (!m || m.columns.length === 0) return null;
  const columns = m.columns.map((c) => ({
    key: c.key,
    label_he: c.label_he,
    label_en: c.label_en,
    field_type: c.field_type,
  })) as MatrixColumnDef[];
  return {
    columns,
    rows: m.rows,
    omittedRowCount: m.omittedRowCount,
  };
}

function buildStep(sr: StepRunInput, lang: Lang): RunReportStep {
  const sd = sr.process_steps?.step_definitions;
  const name = sd ? (lang === "he" ? sd.name_he : sd.name_en) : lang === "he" ? "שלב" : "Step";
  const st = mapStepStatus(sr.status);
  const matrix = matrixFromStep(sr, lang);
  let fields: RunReportField[] = [];
  if (matrix) {
    fields = [];
  } else {
    fields = fieldsFromStepRun(sr, lang);
  }
  return {
    name,
    status: st,
    statusLabel: stepStatusLabel(sr.status, lang),
    fields,
    matrix,
  };
}

function pickFinalSummary(sorted: StepRunInput[], lang: Lang): RunReportField[] {
  for (let i = sorted.length - 1; i >= 0; i--) {
    const sd = sorted[i].process_steps?.step_definitions;
    const nm = sd ? (lang === "he" ? sd.name_he : sd.name_en) : "";
    if (nm && isFinalSummaryStepName(nm)) {
      return fieldsFromStepRun(sorted[i], lang);
    }
  }
  return [];
}

export function buildRunReportFromDb(
  run: ProcessRunInput,
  stepRows: StepRunInput[],
  lang: Lang,
  createdAtIso: string,
): RunReport {
  const rows = [...stepRows].sort((a, b) => {
    const pa = a.process_steps?.process_phases?.order_index ?? 0;
    const pb = b.process_steps?.process_phases?.order_index ?? 0;
    if (pa !== pb) return pa - pb;
    return (a.process_steps?.order_index ?? 0) - (b.process_steps?.order_index ?? 0);
  });

  const def = run.process_definitions;
  const processName = lang === "he" ? def?.name_he ?? def?.code ?? "—" : def?.name_en ?? def?.code ?? "—";

  let completed = 0;
  let pending = 0;
  let failed = 0;
  let skipped = 0;
  for (const r of rows) {
    if (r.status === "completed") completed++;
    else if (r.status === "skipped") skipped++;
    else if (r.status === "failed") failed++;
    else pending++;
  }

  const overall: ReportStatus =
    failed > 0 ? "failed" : pending > 0 ? "pending" : "completed";

  const phases: RunReportPhase[] = [];
  let lastPhaseId = "";
  let phaseIndex = -1;
  for (const sr of rows) {
    const ps = sr.process_steps;
    const ph = ps?.process_phases;
    const phaseId = ps?.process_phase_id ?? "";
    if (phaseId !== lastPhaseId) {
      lastPhaseId = phaseId;
      phaseIndex++;
      const phaseName = ph ? (lang === "he" ? ph.name_he : ph.name_en) : lang === "he" ? "שלב" : "Phase";
      phases.push({
        name: phaseName,
        orderLabel: lang === "he" ? `שלב ${hebrewPhaseLetter(phaseIndex)}` : `Phase ${phaseIndex + 1}`,
        status: "completed",
        statusLabel: "",
        steps: [],
      });
    }
    const step = buildStep(sr, lang);
    phases[phases.length - 1].steps.push(step);
  }
  for (const p of phases) {
    const st = phaseStatusFromSteps(p.steps);
    p.status = st;
    p.statusLabel = phaseStatusLabel(st, lang);
  }

  const finalSummary = pickFinalSummary(rows, lang);

  return {
    reportTitle: lang === "he" ? "סיכום ריצת ייצור" : "Production run summary",
    createdAt: createdAtIso,
    runId: run.id,
    processName,
    processCode: def?.code,
    processVersion: def?.version,
    batchId: run.batch_ref,
    startedAt: run.started_at,
    endedAt: run.completed_at,
    overallStatus: overall,
    completedSteps: completed,
    pendingSteps: pending,
    failedSteps: failed,
    skippedSteps: skipped,
    durationLabel: formatDuration(run.started_at, run.completed_at, lang),
    phases,
    finalSummary,
    rtl: lang === "he",
    lang,
  };
}
