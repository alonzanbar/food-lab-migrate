import React, { useEffect, useMemo, useRef, useState } from "react";
import { translateSelectOptionLabel } from "@/i18n/processSelectOptions";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  NameSignatureField,
  type NameSignatureFieldHandle,
} from "@/components/process/NameSignatureField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Camera, ImagePlus } from "lucide-react";

type FieldDef = {
  key: string;
  label_he: string;
  label_en: string;
  field_type: string;
  required?: boolean;
  options?: string[];
  default_value?: unknown;
  unit?: string;
  validation?: Record<string, unknown>;
};

type Schema =
  | { input_mode: "single_form"; fields: FieldDef[] }
  | { input_mode: "matrix"; columns: FieldDef[] }
  | { input_mode: "hybrid"; fields: FieldDef[] }
  | { input_mode: "system"; fields?: FieldDef[] };

export type StepFormSubmitMeta = {
  imageFiles?: Record<string, File>;
  /**
   * Signature image files for `name_and_signature` fields.
   * Single-form: key is the field key. Matrix: key is `rowIndex::fieldKey` (e.g. `0::worker_name_sig`).
   */
  nameSignatureFiles?: Record<string, File>;
};

function matrixNameSigCompositeKey(rowIndex: number, colKey: string) {
  return `${rowIndex}::${colKey}`;
}

function parseMatrixNameSigCell(raw: string): unknown {
  const s = raw?.trim() ?? "";
  if (!s) return undefined;
  try {
    return JSON.parse(s);
  } catch {
    return raw;
  }
}

function labelFor(f: FieldDef, lang: string) {
  return lang === "he" ? f.label_he : f.label_en;
}

function stringifyFieldValue(value: unknown): string {
  if (value === undefined || value === null) return "";
  return String(value);
}

function emptyRow(
  cols: FieldDef[],
  rowNumber1Based: number,
  processFieldDefaults?: Record<string, unknown> | null,
) {
  const r: Record<string, string> = {};
  for (const c of cols) {
    if (c.validation?.auto_row_index) r[c.key] = String(rowNumber1Based);
    else if (c.field_type === "name_and_signature") {
      if (processFieldDefaults && Object.prototype.hasOwnProperty.call(processFieldDefaults, c.key)) {
        const dv = processFieldDefaults[c.key];
        r[c.key] = typeof dv === "object" && dv !== null ? JSON.stringify(dv) : stringifyFieldValue(dv);
      } else r[c.key] = "";
    }
    else if (processFieldDefaults && Object.prototype.hasOwnProperty.call(processFieldDefaults, c.key)) {
      r[c.key] = stringifyFieldValue(processFieldDefaults[c.key]);
    } else r[c.key] = stringifyFieldValue(c.default_value);
  }
  return r;
}

function flatFieldsForSchema(schema: Schema): FieldDef[] {
  if (schema.input_mode === "matrix") return schema.columns;
  if (schema.input_mode === "system") return schema.fields ?? [];
  return schema.fields;
}

function htmlInputType(fieldType: string): React.HTMLInputTypeAttribute {
  if (
    fieldType === "integer" ||
    fieldType === "number" ||
    fieldType === "temperature" ||
    fieldType === "pressure"
  ) {
    return "number";
  }
  if (fieldType === "date") return "date";
  if (fieldType === "time") return "time";
  if (fieldType === "datetime") return "datetime-local";
  return "text";
}

function SelectFromOptions(props: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  triggerClassName?: string;
}) {
  const { id, value, onChange, options, triggerClassName } = props;
  const { t, lang } = useLanguage();
  return (
    <Select key={`${id ?? "step-select"}-${lang}`} value={value || undefined} onValueChange={onChange}>
      <SelectTrigger id={id} className={triggerClassName}>
        <SelectValue placeholder="—" />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {translateSelectOptionLabel(opt, t)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function InstructionsBanner({ text }: { text: string }) {
  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription>{text}</AlertDescription>
    </Alert>
  );
}

/** Single-form payload: flat key -> value. Matrix: { rows: Record[] } */
export function DynamicStepForm(props: {
  schema: Schema;
  parameterization?: Record<string, unknown> | null;
  /** Per-process_step defaults (`parameterization.field_defaults`); used for matrix new rows and redundant if initialData already merged. */
  processFieldDefaults?: Record<string, unknown> | null;
  initialData?: Record<string, unknown>;
  onSubmit: (
    payload: Record<string, unknown>,
    meta?: StepFormSubmitMeta,
  ) => void | Promise<void>;
  submitLabel: string;
  /** Shown below instruction banner (e.g. final step closes the run). */
  noticeBanner?: string | null;
  disabled?: boolean;
  onBack?: () => void;
  onSaveAndAddRow?: (
    payload: Record<string, unknown>,
    meta?: StepFormSubmitMeta,
  ) => void | Promise<void>;
}) {
  const { lang, t } = useLanguage();
  const { schema, parameterization, processFieldDefaults } = props;

  const instructions = useMemo(() => {
    const ctx = (parameterization?.context || {}) as Record<string, unknown>;
    const he = ctx.instructions_he as string | undefined;
    const en = ctx.instructions_en as string | undefined;
    if (!he && !en) return null;
    return lang === "he" ? he || en : en || he;
  }, [parameterization, lang]);

  const nameSigRefs = useRef<Record<string, NameSignatureFieldHandle | null>>({});

  const [single, setSingle] = useState<Record<string, string>>(() => {
    const init = props.initialData || {};
    const out: Record<string, string> = {};
    const fillFields = (fields: FieldDef[] | undefined) => {
      for (const f of fields || []) {
        if (f.field_type === "name_and_signature") continue;
        const v = init[f.key];
        out[f.key] =
          v === undefined || v === null ? stringifyFieldValue(f.default_value) : stringifyFieldValue(v);
      }
    };
    if (schema.input_mode === "single_form" || schema.input_mode === "hybrid") {
      fillFields(schema.fields);
    } else if (schema.input_mode === "system" && (schema.fields?.length ?? 0) > 0) {
      fillFields(schema.fields);
    }
    return out;
  });

  const [rows, setRows] = useState<Record<string, string>[]>(() => {
    if (schema.input_mode !== "matrix") return [];
    const init = props.initialData as { rows?: Record<string, unknown>[] } | undefined;
    const existing = init?.rows;
    const cols = schema.columns;
    if (existing?.length) {
      return existing.map((r, i) => {
        const row: Record<string, string> = {};
        for (const c of cols) {
          const v = r[c.key];
          if (c.field_type === "name_and_signature") {
            if (v !== undefined && v !== null) {
              row[c.key] = typeof v === "object" ? JSON.stringify(v) : stringifyFieldValue(v);
            } else {
              row[c.key] = "";
            }
            continue;
          }
          let cell =
            v === undefined || v === null
              ? stringifyFieldValue(c.default_value)
              : stringifyFieldValue(v);
          if (c.validation?.auto_row_index && !cell.trim()) {
            cell = String(i + 1);
          }
          row[c.key] = cell;
        }
        return row;
      });
    }
    return [emptyRow(cols, 1, processFieldDefaults ?? null)];
  });

  const [pendingImages, setPendingImages] = useState<Record<string, File | null>>({});
  const [submitting, setSubmitting] = useState(false);
  const [activeRowIndex, setActiveRowIndex] = useState(0);

  const fields = flatFieldsForSchema(schema);

  useEffect(() => {
    if (schema.input_mode !== "matrix") return;
    setActiveRowIndex((idx) => {
      if (rows.length === 0) return 0;
      return Math.min(idx, rows.length - 1);
    });
  }, [rows, schema.input_mode]);

  function pickImageFile(fieldKey: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPendingImages((p) => ({ ...p, [fieldKey]: file ?? null }));
    e.target.value = "";
  }

  async function buildMatrixRowsWithSignatures(): Promise<
    { rows: Record<string, unknown>[]; nameSignatureFiles: Record<string, File> } | null
  > {
    if (schema.input_mode !== "matrix") return null;
    const cols = schema.columns;
    const out: Record<string, unknown>[] = [];
    const nameSignatureFiles: Record<string, File> = {};

    for (let ri = 0; ri < rows.length; ri++) {
      const rowOut: Record<string, unknown> = {};
      for (const c of cols) {
        if (c.validation?.auto_row_index) {
          const raw = rows[ri][c.key]?.trim() || String(ri + 1);
          rowOut[c.key] = parseInt(raw, 10);
          continue;
        }
        if (c.field_type === "name_and_signature") {
          const ck = matrixNameSigCompositeKey(ri, c.key);
          const h = nameSigRefs.current[ck];
          if (!h) {
            alert(t("common.error"));
            return null;
          }
          const p = await h.prepareSubmit();
          if (c.required && !p) return null;
          if (!p) {
            rowOut[c.key] = { name: "", signatureUrl: null };
          } else {
            rowOut[c.key] = {
              name: p.name,
              signatureUrl: p.existingSignatureUrl,
            };
            if (p.signatureFile) nameSignatureFiles[ck] = p.signatureFile;
          }
          continue;
        }
        const raw = rows[ri][c.key]?.trim() ?? "";
        if (c.required && !raw) {
          alert(t("common.required"));
          return null;
        }
        rowOut[c.key] = coerceValue(c.field_type, raw);
      }
      out.push(rowOut);
    }
    return { rows: out, nameSignatureFiles };
  }

  function setMatrixCellValue(rowIndex: number, key: string, value: string) {
    setRows((prev) => {
      const next = [...prev];
      next[rowIndex] = { ...next[rowIndex], [key]: value };
      return next;
    });
  }

  function appendEmptyMatrixRow() {
    if (schema.input_mode !== "matrix") return;
    setRows((prev) => {
      const next = [...prev, emptyRow(schema.columns, prev.length + 1, processFieldDefaults ?? null)];
      setActiveRowIndex(next.length - 1);
      return next;
    });
  }

  async function handleMatrixSaveAndAddRow() {
    if (schema.input_mode !== "matrix" || !props.onSaveAndAddRow) return;

    setSubmitting(true);
    try {
      const built = await buildMatrixRowsWithSignatures();
      if (!built) return;
      const meta: StepFormSubmitMeta = {};
      if (Object.keys(built.nameSignatureFiles).length > 0) meta.nameSignatureFiles = built.nameSignatureFiles;
      await props.onSaveAndAddRow(
        { rows: built.rows },
        Object.keys(meta).length > 0 ? meta : undefined,
      );
      appendEmptyMatrixRow();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (schema.input_mode === "matrix") {
        const built = await buildMatrixRowsWithSignatures();
        if (!built) {
          setSubmitting(false);
          return;
        }
        const meta: StepFormSubmitMeta = {};
        if (Object.keys(built.nameSignatureFiles).length > 0) meta.nameSignatureFiles = built.nameSignatureFiles;
        await props.onSubmit(
          { rows: built.rows },
          Object.keys(meta).length > 0 ? meta : undefined,
        );
      } else {
        const imageFiles: Record<string, File> = {};
        const nameSignatureFiles: Record<string, File> = {};
        const out: Record<string, unknown> = {};
        for (const f of fields) {
          if (f.field_type === "name_and_signature") {
            const handle = nameSigRefs.current[f.key];
            if (!handle) {
              alert(t("common.error"));
              setSubmitting(false);
              return;
            }
            const payload = await handle.prepareSubmit();
            if (!payload) {
              setSubmitting(false);
              return;
            }
            out[f.key] = {
              name: payload.name,
              signatureUrl: payload.existingSignatureUrl,
            };
            if (payload.signatureFile) nameSignatureFiles[f.key] = payload.signatureFile;
            continue;
          }
          if (f.field_type === "image") {
            const pending = pendingImages[f.key];
            if (f.required && !pending && !single[f.key]?.trim()) {
              alert(t("common.required"));
              setSubmitting(false);
              return;
            }
            if (pending) imageFiles[f.key] = pending;
            else out[f.key] = single[f.key]?.trim() || null;
            continue;
          }
          const raw = single[f.key]?.trim() ?? "";
          if (f.required && raw === "") {
            alert(t("common.required"));
            setSubmitting(false);
            return;
          }
          out[f.key] = coerceValue(f.field_type, raw);
        }
        const meta: StepFormSubmitMeta = {};
        if (Object.keys(imageFiles).length > 0) meta.imageFiles = imageFiles;
        if (Object.keys(nameSignatureFiles).length > 0) meta.nameSignatureFiles = nameSignatureFiles;
        await props.onSubmit(out, Object.keys(meta).length > 0 ? meta : undefined);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function coerceValue(fieldType: string, raw: string): unknown {
    if (raw === "") return null;
    if (fieldType === "integer") return parseInt(raw, 10);
    if (fieldType === "number" || fieldType === "temperature" || fieldType === "pressure")
      return parseFloat(raw);
    if (fieldType === "boolean") return raw === "true" || raw === "1";
    return raw;
  }

  function renderMatrixCellControl(
    c: FieldDef,
    value: string,
    onChange: (v: string) => void,
    id: string,
    rowIndex: number,
  ): React.ReactNode {
    if (c.validation?.auto_row_index) {
      const v = value.trim() ? value : String(rowIndex + 1);
      return (
        <Input
          id={id}
          type="number"
          value={v}
          readOnly
          disabled
          className="min-w-0 bg-muted"
          aria-label={labelFor(c, lang)}
        />
      );
    }

    if (c.field_type === "name_and_signature") {
      const ck = matrixNameSigCompositeKey(rowIndex, c.key);
      return (
        <div className="min-w-[12rem] max-w-[min(100vw-2rem,28rem)] py-1">
          <NameSignatureField
            key={ck}
            ref={(instance) => {
              nameSigRefs.current[ck] = instance;
            }}
            fieldKey={ck}
            label={labelFor(c, lang)}
            required={c.required}
            disabled={!!props.disabled}
            initialValue={parseMatrixNameSigCell(value)}
            translate={t}
            lang={lang}
          />
        </div>
      );
    }

    if (c.field_type === "select" && c.options?.length) {
      return (
        <SelectFromOptions
          id={id}
          value={value}
          onChange={onChange}
          options={c.options}
          triggerClassName="w-full min-w-[8rem]"
        />
      );
    }

    return (
      <Input
        id={id}
        type={htmlInputType(c.field_type)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0"
      />
    );
  }

  function renderField(f: FieldDef, value: string, onChange: (v: string) => void) {
    const id = `f-${f.key}`;
    const lab = labelFor(f, lang);
    const pending = pendingImages[f.key];
    const existingUrl = value.startsWith("http") ? value : null;

    if (f.field_type === "name_and_signature") {
      return (
        <NameSignatureField
          key={f.key}
          ref={(instance) => {
            nameSigRefs.current[f.key] = instance;
          }}
          fieldKey={f.key}
          label={lab}
          required={f.required}
          disabled={!!props.disabled}
          initialValue={props.initialData?.[f.key]}
          translate={t}
          lang={lang}
        />
      );
    }

    if (f.field_type === "image") {
      return (
        <div key={f.key} className="space-y-2">
          <Label>
            {lab}
            {f.required ? " *" : ""}
          </Label>
          <div className="flex flex-wrap gap-2 items-center">
            <Input
              id={`${id}-cam`}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => pickImageFile(f.key, e)}
            />
            <Button type="button" variant="outline" size="sm" className="gap-1" asChild>
              <label htmlFor={`${id}-cam`} className="cursor-pointer">
                <Camera className="h-4 w-4" />
                {lang === "he" ? "מצלמה" : "Camera"}
              </label>
            </Button>
            <Input
              id={`${id}-gal`}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pickImageFile(f.key, e)}
            />
            <Button type="button" variant="outline" size="sm" className="gap-1" asChild>
              <label htmlFor={`${id}-gal`} className="cursor-pointer">
                <ImagePlus className="h-4 w-4" />
                {lang === "he" ? "גלריה" : "Gallery"}
              </label>
            </Button>
            {pending && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setPendingImages((p) => ({ ...p, [f.key]: null }))}>
                {lang === "he" ? "ביטול" : "Clear"}
              </Button>
            )}
          </div>
          {pending && <p className="text-sm text-muted-foreground">{pending.name}</p>}
          {existingUrl && !pending && (
            <img src={existingUrl} alt="" className="max-h-32 rounded-md border object-contain" />
          )}
        </div>
      );
    }

    if (f.field_type === "textarea") {
      return (
        <div key={f.key} className="space-y-2">
          <Label htmlFor={id}>
            {lab}
            {f.required ? " *" : ""}
          </Label>
          <Textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} rows={3} />
        </div>
      );
    }

    if (f.field_type === "boolean") {
      return (
        <div key={f.key} className="flex items-center gap-2">
          <Checkbox
            id={id}
            checked={value === "true"}
            onCheckedChange={(c) => onChange(c === true ? "true" : "false")}
          />
          <Label htmlFor={id}>{lab}</Label>
        </div>
      );
    }

    if (f.field_type === "select" && f.options?.length) {
      return (
        <div key={f.key} className="space-y-2">
          <Label>
            {lab}
            {f.required ? " *" : ""}
          </Label>
          <SelectFromOptions id={id} value={value} onChange={onChange} options={f.options} />
        </div>
      );
    }

    return (
      <div key={f.key} className="space-y-2">
        <Label htmlFor={id}>
          {lab}
          {f.unit ? ` (${f.unit})` : ""}
          {f.required ? " *" : ""}
        </Label>
        <Input id={id} type={htmlInputType(f.field_type)} value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }

  const submitButton = (
    <Button type="submit" className="w-full h-12" disabled={props.disabled || submitting}>
      {submitting ? t("common.loading") : props.submitLabel}
    </Button>
  );

  if (schema.input_mode === "matrix") {
    const activeRow = rows[activeRowIndex];
    const rowLabel = lang === "he" ? "שורה" : "Row";
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        {instructions ? <InstructionsBanner text={instructions} /> : null}
        {props.noticeBanner ? <InstructionsBanner text={props.noticeBanner} /> : null}
        <div className="space-y-3 md:hidden">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {rowLabel} {activeRowIndex + 1}/{rows.length}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={appendEmptyMatrixRow}
              disabled={props.disabled || submitting}
            >
              {t("process.addRow")}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {rows.map((_, ri) => (
              <Button
                key={`row-chip-${ri}`}
                type="button"
                variant={ri === activeRowIndex ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveRowIndex(ri)}
                disabled={props.disabled || submitting}
              >
                {rowLabel} {ri + 1}
              </Button>
            ))}
          </div>
          {activeRow ? (
            <div className="space-y-3 border rounded-lg p-3">
              {schema.columns.map((c) => (
                <div key={`mobile-row-${activeRowIndex}-${c.key}`} className="space-y-2">
                  <Label htmlFor={`rm-${activeRowIndex}-${c.key}`}>
                    {labelFor(c, lang)}
                    {c.unit ? ` (${c.unit})` : ""}
                    {c.required ? " *" : ""}
                  </Label>
                  {renderMatrixCellControl(
                    c,
                    activeRow[c.key] ?? "",
                    (v) => setMatrixCellValue(activeRowIndex, c.key, v),
                    `rm-${activeRowIndex}-${c.key}`,
                    activeRowIndex,
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <div className="hidden md:block overflow-x-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                {schema.columns.map((c) => (
                  <th key={c.key} className="p-2 text-start">
                    {labelFor(c, lang)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className="border-b">
                  {schema.columns.map((c) => (
                    <td key={c.key} className="p-2">
                      {renderMatrixCellControl(
                        c,
                        row[c.key] ?? "",
                        (v) => setMatrixCellValue(ri, c.key, v),
                        `m-${ri}-${c.key}`,
                        ri,
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="sticky bottom-0 z-10 border-t bg-background/95 backdrop-blur p-2 flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => props.onBack?.()}
            disabled={props.disabled || submitting || !props.onBack}
          >
            {t("common.back")}
          </Button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={handleMatrixSaveAndAddRow}
              disabled={props.disabled || submitting || !props.onSaveAndAddRow}
            >
              {t("process.saveAndAddRow")}
            </Button>
            <Button type="submit" disabled={props.disabled || submitting}>
              {submitting ? t("common.loading") : t("process.finishStep")}
            </Button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {instructions ? <InstructionsBanner text={instructions} /> : null}
      {props.noticeBanner ? <InstructionsBanner text={props.noticeBanner} /> : null}
      {fields.map((f) =>
        renderField(f, single[f.key] ?? "", (v) => setSingle((s) => ({ ...s, [f.key]: v }))),
      )}
      {submitButton}
    </form>
  );
}
