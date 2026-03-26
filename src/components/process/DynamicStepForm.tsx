import React, { useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
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
};

function labelFor(f: FieldDef, lang: string) {
  return lang === "he" ? f.label_he : f.label_en;
}

function emptyRow(cols: FieldDef[], rowNumber1Based: number) {
  const r: Record<string, string> = {};
  for (const c of cols) {
    if (c.validation?.auto_row_index) r[c.key] = String(rowNumber1Based);
    else r[c.key] = "";
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
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger id={id} className={triggerClassName}>
        <SelectValue placeholder="—" />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {opt}
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
  initialData?: Record<string, unknown>;
  onSubmit: (
    payload: Record<string, unknown>,
    meta?: StepFormSubmitMeta,
  ) => void | Promise<void>;
  submitLabel: string;
  disabled?: boolean;
}) {
  const { lang, t } = useLanguage();
  const { schema, parameterization } = props;

  const instructions = useMemo(() => {
    const ctx = (parameterization?.context || {}) as Record<string, unknown>;
    const he = ctx.instructions_he as string | undefined;
    const en = ctx.instructions_en as string | undefined;
    if (!he && !en) return null;
    return lang === "he" ? he || en : en || he;
  }, [parameterization, lang]);

  const [single, setSingle] = useState<Record<string, string>>(() => {
    const init = props.initialData || {};
    const out: Record<string, string> = {};
    if (schema.input_mode === "single_form" || schema.input_mode === "hybrid") {
      for (const f of schema.fields || []) {
        const v = init[f.key];
        out[f.key] = v === undefined || v === null ? "" : String(v);
      }
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
          let cell = v === undefined || v === null ? "" : String(v);
          if (c.validation?.auto_row_index && !cell.trim()) {
            cell = String(i + 1);
          }
          row[c.key] = cell;
        }
        return row;
      });
    }
    return [emptyRow(cols, 1)];
  });

  const [pendingImages, setPendingImages] = useState<Record<string, File | null>>({});
  const [submitting, setSubmitting] = useState(false);

  const fields = flatFieldsForSchema(schema);

  function pickImageFile(fieldKey: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPendingImages((p) => ({ ...p, [fieldKey]: file ?? null }));
    e.target.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (schema.input_mode === "matrix") {
        const cleaned = rows.map((r, ri) => {
          const o: Record<string, unknown> = {};
          for (const c of schema.columns) {
            if (c.validation?.auto_row_index) {
              const raw = r[c.key]?.trim() || String(ri + 1);
              o[c.key] = parseInt(raw, 10);
              continue;
            }
            const raw = r[c.key]?.trim() ?? "";
            o[c.key] = coerceValue(c.field_type, raw);
          }
          return o;
        });
        await props.onSubmit({ rows: cleaned });
      } else {
        const imageFiles: Record<string, File> = {};
        const out: Record<string, unknown> = {};
        for (const f of fields) {
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
        const meta = Object.keys(imageFiles).length > 0 ? { imageFiles } : undefined;
        await props.onSubmit(out, meta);
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
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        {instructions ? <InstructionsBanner text={instructions} /> : null}
        <div className="overflow-x-auto border rounded-lg">
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
                        (v) => {
                          const next = [...rows];
                          next[ri] = { ...next[ri], [c.key]: v };
                          setRows(next);
                        },
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
        <Button
          type="button"
          variant="outline"
          onClick={() => setRows([...rows, emptyRow(schema.columns, rows.length + 1)])}
        >
          {t("process.addRow")}
        </Button>
        {submitButton}
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {instructions ? <InstructionsBanner text={instructions} /> : null}
      {fields.map((f) =>
        renderField(f, single[f.key] || "", (v) => setSingle((s) => ({ ...s, [f.key]: v }))),
      )}
      {submitButton}
    </form>
  );
}
