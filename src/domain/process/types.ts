/**
 * Process engine domain types (aligned with Postgres enums/columns in
 * supabase/migrations/*_process_engine_domain.sql).
 */

export type StepType = "plan" | "execution" | "measurement" | "validation";

export type InputMode = "single_form" | "matrix" | "hybrid" | "system";

export type ProcessDefinitionStatus = "draft" | "published" | "archived";

export type ProcessRunStatus = "pending" | "in_progress" | "completed" | "cancelled";

export type ProcessStepRunStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "skipped"
  | "failed";

export type StandardVersionStatus = "draft" | "active" | "archived";

/** CP/CCP annotation only — not duplicated on ProcessStep in DB. */
export type StandardClassification = "cp" | "ccp" | "none";

/** Row shape for `step_definitions` */
export interface StepDefinition {
  id: string;
  tenant_id: string | null;
  code: string;
  step_type: StepType;
  name_he: string;
  name_en: string;
  description: string | null;
  input_mode: InputMode;
  schema: StepSchemaJson;
  supports_matrix: boolean;
  default_validation_behavior: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

/** Row shape for `process_definitions` */
export interface ProcessDefinition {
  id: string;
  tenant_id: string;
  code: string;
  name_he: string;
  name_en: string;
  version: string;
  status: ProcessDefinitionStatus;
  created_at: string;
  updated_at: string;
}

/** Row shape for `process_phases` */
export interface ProcessPhase {
  id: string;
  process_definition_id: string;
  code: string;
  name_he: string;
  name_en: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

/** Row shape for `process_steps` — validation/thresholds live in `parameterization`. */
export interface ProcessStep {
  id: string;
  process_definition_id: string;
  process_phase_id: string;
  step_definition_id: string;
  order_index: number;
  parameterization: ProcessStepParameterization;
  ui_config: Record<string, unknown> | null;
  dependencies: unknown;
  required: boolean;
  repeatable: boolean;
  skippable: boolean;
  /** At most one per process_definition; completing this step run can close the run when guards pass. */
  is_final_step: boolean;
  created_at: string;
  updated_at: string;
}

/** Row shape for `process_runs` */
export interface ProcessRun {
  id: string;
  tenant_id: string;
  process_definition_id: string;
  status: ProcessRunStatus;
  batch_ref: string | null;
  started_at: string;
  completed_at: string | null;
  started_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Row shape for `process_step_runs` */
export interface ProcessStepRun {
  id: string;
  tenant_id: string;
  process_run_id: string;
  process_step_id: string;
  status: ProcessStepRunStatus;
  captured_data: Record<string, unknown>;
  approvals: Record<string, unknown> | null;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Row shape for `standards` */
export interface Standard {
  id: string;
  tenant_id: string | null;
  code: string;
  name_he: string;
  name_en: string;
  created_at: string;
  updated_at: string;
}

/** Row shape for `standard_versions` */
export interface StandardVersion {
  id: string;
  standard_id: string;
  version: string;
  status: StandardVersionStatus;
  effective_from: string | null;
  effective_to: string | null;
  created_at: string;
  updated_at: string;
}

/** Row shape for `standard_process_steps` — annotation layer only. */
export interface StandardProcessStep {
  id: string;
  standard_version_id: string;
  process_step_id: string;
  classification: StandardClassification;
  is_enforced: boolean;
  control_code: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * JSON stored in `step_definitions.schema` — evolves with seeds/UI.
 * Canonical field definitions for reusable steps.
 */
export type StepSchemaJson =
  | SingleFormStepSchema
  | MatrixStepSchema
  | HybridStepSchema
  | SystemStepSchema;

export interface SingleFormStepSchema {
  input_mode: "single_form";
  fields: FieldDef[];
}

export interface MatrixStepSchema {
  input_mode: "matrix";
  columns: FieldDef[];
}

export interface HybridStepSchema {
  input_mode: "hybrid";
  fields: FieldDef[];
}

export interface SystemStepSchema {
  input_mode: "system";
  fields?: FieldDef[];
}

export interface FieldDef {
  key: string;
  label_he: string;
  label_en: string;
  field_type: FieldType;
  required?: boolean;
  options?: string[];
  default_value?: unknown;
  unit?: string;
  validation?: Record<string, unknown>;
}

export type FieldType =
  | "text"
  | "number"
  | "integer"
  | "date"
  | "time"
  | "datetime"
  | "boolean"
  | "select"
  | "signature"
  | "textarea"
  | "temperature"
  | "pressure"
  | "graph_ref"
  | "image";

/**
 * JSON in `process_steps.parameterization` — operational rules for this step instance.
 * Not for CP/CCP classification (use StandardProcessStep).
 */
export type ProcessStepParameterization = {
  context?: Record<string, unknown>;
  operational?: Record<string, unknown>;
  data_rules?: DataRules;
  validation?: ValidationParameterization;
  timing?: Record<string, unknown>;
  approvals?: ApprovalsParameterization;
} & Record<string, unknown>;

export interface DataRules {
  required_fields?: string[];
  required_columns?: string[];
  min_rows?: number;
  max_rows?: number;
}

export interface ValidationParameterization {
  mode?: "none" | "soft" | "strict";
  requires_graph_check?: boolean;
  /** Execution-time approvals — distinct from standard enforcement flags */
  requires_manager_approval?: boolean;
  [key: string]: unknown;
}

export interface ApprovalsParameterization {
  manager_required?: boolean;
  quality_required?: boolean;
  [key: string]: unknown;
}
