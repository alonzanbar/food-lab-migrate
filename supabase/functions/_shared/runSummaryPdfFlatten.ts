/** Pure helpers for run-summary PDF (Edge + Vitest). */

export const MAX_MATRIX_ROWS = 45;

export type Lang = "he" | "en";

export type FieldDef = { key: string; label_he: string; label_en: string; field_type?: string };
export type Schema = Record<string, unknown>;

export function labelForField(f: FieldDef, lang: Lang): string {
  return lang === "he" ? f.label_he || f.label_en : f.label_en || f.label_he;
}

/** Matrix payload for tabular PDF rendering (not used by flattenCaptured string output). */
export type MatrixPdfData = {
  columns: FieldDef[];
  rows: Record<string, unknown>[];
  omittedRowCount: number;
};

/** Returns matrix columns + row slice when mode is matrix; otherwise null. */
export function extractMatrixForPdf(
  captured: Record<string, unknown>,
  schema: Schema | null,
  inputMode: string,
): MatrixPdfData | null {
  const mode = (schema?.input_mode as string) || inputMode || "single_form";
  if (mode !== "matrix") return null;
  const cols = (schema?.columns as FieldDef[]) || [];
  const rows = (captured.rows as Record<string, unknown>[]) || [];
  const slice = rows.slice(0, MAX_MATRIX_ROWS);
  const omitted = Math.max(0, rows.length - MAX_MATRIX_ROWS);
  return { columns: cols, rows: slice, omittedRowCount: omitted };
}

function emptyPlaceholder(lang: Lang): string {
  return lang === "he" ? "אין נתונים" : "(no data)";
}

export function flattenCaptured(
  captured: Record<string, unknown>,
  schema: Schema | null,
  inputMode: string,
  lang: Lang,
): string[] {
  const out: string[] = [];
  const mode = (schema?.input_mode as string) || inputMode || "single_form";

  if (mode === "matrix") {
    const cols = (schema?.columns as FieldDef[]) || [];
    const rows = (captured.rows as Record<string, unknown>[]) || [];
    if (cols.length === 0 && rows.length === 0) {
      return [emptyPlaceholder(lang)];
    }
    const slice = rows.slice(0, MAX_MATRIX_ROWS);
    const headers = cols.map((c) => labelForField(c, lang)).join(" | ");
    out.push(headers);
    for (let i = 0; i < slice.length; i++) {
      const r = slice[i];
      const cells = cols.map((c) => String(r[c.key] ?? "")).join(" | ");
      out.push(`${i + 1}. ${cells}`);
    }
    if (rows.length > MAX_MATRIX_ROWS) {
      out.push(`… (${rows.length - MAX_MATRIX_ROWS} more rows omitted)`);
    }
    if (out.length === 0) out.push(emptyPlaceholder(lang));
    return out;
  }

  const fields = (schema?.fields as FieldDef[]) || [];
  const labelByKey = new Map(fields.map((f) => [f.key, labelForField(f, lang)]));
  for (const [k, v] of Object.entries(captured)) {
    if (k === "rows") continue;
    const label = labelByKey.get(k) ?? k;
    const val = v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
    out.push(`${label}: ${val}`);
  }
  if (out.length === 0) out.push(emptyPlaceholder(lang));
  return out;
}
