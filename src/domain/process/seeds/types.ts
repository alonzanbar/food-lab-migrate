import type { InputMode, StepSchemaJson, StepType } from "../types";

/**
 * Serializable global catalog row for `step_definitions` (before insert).
 * Stable `id` is shared with `supabase/migrations/*_seed_global_step_definitions.sql`.
 */
export interface StepDefinitionSeed {
  id: string;
  code: string;
  step_type: StepType;
  name_he: string;
  name_en: string;
  description: string | null;
  input_mode: InputMode;
  schema: StepSchemaJson;
  supports_matrix: boolean;
  default_validation_behavior: Record<string, unknown> | null;
}
