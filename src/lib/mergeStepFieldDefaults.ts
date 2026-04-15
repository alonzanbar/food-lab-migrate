/**
 * Merge order for step form hydration: captured_data wins when a key is present,
 * then process_steps.parameterization.field_defaults, then step_definitions field default_value.
 */

export type FieldDefLike = { key: string; default_value?: unknown };

export function isKeyProvided(obj: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

/** Normalize parameterization.field_defaults from JSON (must be a plain object). */
export function pickFieldDefaults(
  parameterization: Record<string, unknown> | null | undefined,
): Record<string, unknown> | undefined {
  const raw = parameterization?.field_defaults;
  if (raw === null || raw === undefined) return undefined;
  if (typeof raw !== "object" || Array.isArray(raw)) return undefined;
  return raw as Record<string, unknown>;
}

/** Flat single_form / hybrid / system: keep all captured keys; fill missing field keys from defaults. */
export function mergeFlatStepInitial(
  captured: Record<string, unknown>,
  fieldDefaults: Record<string, unknown> | undefined,
  fields: FieldDefLike[],
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...captured };
  for (const f of fields) {
    if (isKeyProvided(captured, f.key)) continue;
    if (fieldDefaults && isKeyProvided(fieldDefaults, f.key)) {
      out[f.key] = fieldDefaults[f.key];
      continue;
    }
    if (f.default_value !== undefined) {
      out[f.key] = f.default_value;
    }
  }
  return out;
}

/** Matrix: merge missing cell keys per row from field_defaults then column default_value. */
export function mergeMatrixRowsInitial(
  captured: Record<string, unknown>,
  fieldDefaults: Record<string, unknown> | undefined,
  columns: FieldDefLike[],
): { rows: Record<string, unknown>[] } {
  const rowsRaw = captured.rows;
  const rows = Array.isArray(rowsRaw) ? (rowsRaw as Record<string, unknown>[]) : [];
  if (rows.length === 0) return { rows: [] };
  return {
    rows: rows.map((r) => {
      const row: Record<string, unknown> = { ...r };
      for (const c of columns) {
        if (isKeyProvided(r, c.key)) continue;
        if (fieldDefaults && isKeyProvided(fieldDefaults, c.key)) {
          row[c.key] = fieldDefaults[c.key];
          continue;
        }
        if (c.default_value !== undefined) {
          row[c.key] = c.default_value;
        }
      }
      return row;
    }),
  };
}
