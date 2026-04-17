import { z } from "zod";

/** Mirrors Postgres enums — keep in sync with migrations. */

export const stepTypeSchema = z.enum(["plan", "execution", "measurement", "validation"]);
export const inputModeSchema = z.enum(["single_form", "matrix", "hybrid", "system"]);
export const processDefinitionStatusSchema = z.enum(["draft", "published", "archived"]);
export const processRunStatusSchema = z.enum([
  "pending",
  "in_progress",
  "completed",
  "cancelled",
]);
export const processStepRunStatusSchema = z.enum([
  "pending",
  "in_progress",
  "completed",
  "skipped",
  "failed",
]);
export const standardVersionStatusSchema = z.enum(["draft", "active", "archived"]);
export const standardClassificationSchema = z.enum(["cp", "ccp", "none"]);

export const fieldTypeSchema = z.enum([
  "text",
  "number",
  "integer",
  "date",
  "time",
  "datetime",
  "boolean",
  "select",
  "signature",
  "name_and_signature",
  "textarea",
  "temperature",
  "pressure",
  "graph_ref",
  "image",
]);

export const fieldDefSchema: z.ZodType<import("./types").FieldDef> = z.object({
  key: z.string().min(1),
  label_he: z.string(),
  label_en: z.string(),
  field_type: fieldTypeSchema,
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  default_value: z.unknown().optional(),
  unit: z.string().optional(),
  validation: z.record(z.unknown()).optional(),
});

const singleFormSchema = z.object({
  input_mode: z.literal("single_form"),
  fields: z.array(fieldDefSchema),
});

const matrixSchema = z.object({
  input_mode: z.literal("matrix"),
  columns: z.array(fieldDefSchema),
});

const hybridSchema = z.object({
  input_mode: z.literal("hybrid"),
  fields: z.array(fieldDefSchema),
});

const systemSchema = z.object({
  input_mode: z.literal("system"),
  fields: z.array(fieldDefSchema).optional(),
});

/** Validates `step_definitions.schema` when strict structure is needed. */
export const stepSchemaJsonSchema = z.discriminatedUnion("input_mode", [
  singleFormSchema,
  matrixSchema,
  hybridSchema,
  systemSchema,
]);

/** Loose JSON for early iteration / DB round-trips */
export const stepSchemaJsonLooseSchema = z.union([stepSchemaJsonSchema, z.record(z.unknown())]);

const dataRulesSchema = z
  .object({
    required_fields: z.array(z.string()).optional(),
    required_columns: z.array(z.string()).optional(),
    min_rows: z.number().int().optional(),
    max_rows: z.number().int().optional(),
  })
  .passthrough();

const validationParameterizationSchema = z
  .object({
    mode: z.enum(["none", "soft", "strict"]).optional(),
    requires_graph_check: z.boolean().optional(),
    requires_manager_approval: z.boolean().optional(),
  })
  .passthrough();

const approvalsParameterizationSchema = z
  .object({
    manager_required: z.boolean().optional(),
    quality_required: z.boolean().optional(),
  })
  .passthrough();

/** `process_steps.parameterization` — extend as seeds mature. */
export const processStepParameterizationSchema = z
  .object({
    context: z.record(z.unknown()).optional(),
    operational: z.record(z.unknown()).optional(),
    data_rules: dataRulesSchema.optional(),
    validation: validationParameterizationSchema.optional(),
    timing: z.record(z.unknown()).optional(),
    approvals: approvalsParameterizationSchema.optional(),
    field_defaults: z.record(z.unknown()).optional(),
  })
  .passthrough();

export const stepDefinitionSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid().nullable(),
  code: z.string().min(1),
  step_type: stepTypeSchema,
  name_he: z.string(),
  name_en: z.string(),
  description: z.string().nullable(),
  input_mode: inputModeSchema,
  schema: z.union([stepSchemaJsonSchema, z.record(z.unknown())]),
  supports_matrix: z.boolean(),
  default_validation_behavior: z.record(z.unknown()).nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

/** Global `step_definitions` seed rows (stable `id` matches SQL migration). */
export const stepDefinitionSeedSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1),
  step_type: stepTypeSchema,
  name_he: z.string(),
  name_en: z.string(),
  description: z.string().nullable(),
  input_mode: inputModeSchema,
  schema: z.union([stepSchemaJsonSchema, z.record(z.unknown())]),
  supports_matrix: z.boolean(),
  default_validation_behavior: z.record(z.unknown()).nullable(),
});

export const processDefinitionSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  code: z.string().min(1),
  name_he: z.string(),
  name_en: z.string(),
  version: z.string().min(1),
  status: processDefinitionStatusSchema,
  created_at: z.string(),
  updated_at: z.string(),
});

export const processPhaseSchema = z.object({
  id: z.string().uuid(),
  process_definition_id: z.string().uuid(),
  code: z.string().min(1),
  name_he: z.string(),
  name_en: z.string(),
  order_index: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const processStepSchema = z.object({
  id: z.string().uuid(),
  process_definition_id: z.string().uuid(),
  process_phase_id: z.string().uuid(),
  step_definition_id: z.string().uuid(),
  order_index: z.number().int(),
  parameterization: processStepParameterizationSchema,
  ui_config: z.record(z.unknown()).nullable(),
  dependencies: z.unknown().nullable(),
  required: z.boolean(),
  repeatable: z.boolean(),
  skippable: z.boolean(),
  is_final_step: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const processRunSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  process_definition_id: z.string().uuid(),
  status: processRunStatusSchema,
  batch_ref: z.string().nullable(),
  started_at: z.string(),
  completed_at: z.string().nullable(),
  started_by: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const processStepRunSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  process_run_id: z.string().uuid(),
  process_step_id: z.string().uuid(),
  status: processStepRunStatusSchema,
  captured_data: z.record(z.unknown()),
  approvals: z.record(z.unknown()).nullable(),
  notes: z.string().nullable(),
  completed_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const standardSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid().nullable(),
  code: z.string().min(1),
  name_he: z.string(),
  name_en: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const standardVersionSchema = z.object({
  id: z.string().uuid(),
  standard_id: z.string().uuid(),
  version: z.string().min(1),
  status: standardVersionStatusSchema,
  effective_from: z.string().nullable(),
  effective_to: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const standardProcessStepSchema = z.object({
  id: z.string().uuid(),
  standard_version_id: z.string().uuid(),
  process_step_id: z.string().uuid(),
  classification: standardClassificationSchema,
  is_enforced: z.boolean(),
  control_code: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
