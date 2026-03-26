import { stepDefinitionSeedSchema } from "../../schemas";
import type { StepDefinitionSeed } from "../types";

/** Stable UUIDs shared with SQL migration `*_seed_global_step_definitions.sql`. */
export const GLOBAL_STEP_DEFINITION_IDS = {
  breaking_crush: "e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a01",
  breaking_time_control: "e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a02",
  breaking_additives: "e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a03",
  breaking_filtration: "e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a04",
  breaking_cooling: "e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a05",
  breaking_intermediate_storage: "e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a06",
  pre_pasteurization_readiness: "e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a07",
  pasteurization_phase_marker: "e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a08",
  pasteurization_execution: "e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a09",
  pasteurization_curve_validation: "e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a0a",
  cooling_curve_validation: "e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a0b",
} as const;

const breakingCrush: StepDefinitionSeed = {
  id: GLOBAL_STEP_DEFINITION_IDS.breaking_crush,
  code: "breaking_crush",
  step_type: "execution",
  name_he: "שבירה",
  name_en: "Breaking / crushing",
  description: "רישום ביצוע שבירה (כמות, מפעיל, הערות).",
  input_mode: "single_form",
  supports_matrix: false,
  default_validation_behavior: null,
  schema: {
    input_mode: "single_form",
    fields: [
      {
        key: "batch_code",
        label_he: "קוד אצווה",
        label_en: "Batch code",
        field_type: "text",
        required: true,
      },
      {
        key: "operator_name",
        label_he: "מפעיל",
        label_en: "Operator",
        field_type: "text",
        required: true,
      },
      {
        key: "quantity_kg",
        label_he: 'כמות (ק"ג)',
        label_en: "Quantity (kg)",
        field_type: "number",
        required: true,
        unit: "kg",
      },
      {
        key: "started_at",
        label_he: "התחלה",
        label_en: "Started at",
        field_type: "datetime",
        required: false,
      },
      {
        key: "notes",
        label_he: "הערות",
        label_en: "Notes",
        field_type: "textarea",
        required: false,
      },
    ],
  },
};

const breakingTimeControl: StepDefinitionSeed = {
  id: GLOBAL_STEP_DEFINITION_IDS.breaking_time_control,
  code: "breaking_time_control",
  step_type: "measurement",
  name_he: "בקרת זמן בין שלבים",
  name_en: "Time control between stages",
  description: null,
  input_mode: "single_form",
  supports_matrix: false,
  default_validation_behavior: null,
  schema: {
    input_mode: "single_form",
    fields: [
      {
        key: "elapsed_minutes",
        label_he: "דקות שחלפו",
        label_en: "Elapsed (minutes)",
        field_type: "integer",
        required: true,
      },
      {
        key: "within_spec",
        label_he: "בטווח המותר",
        label_en: "Within allowed range",
        field_type: "boolean",
        required: true,
      },
      {
        key: "notes",
        label_he: "הערות",
        label_en: "Notes",
        field_type: "textarea",
        required: false,
      },
    ],
  },
};

const breakingAdditives: StepDefinitionSeed = {
  id: GLOBAL_STEP_DEFINITION_IDS.breaking_additives,
  code: "breaking_additives",
  step_type: "execution",
  name_he: "תוספות",
  name_en: "Additives",
  description: "מטריצת שורות: חומר, כמות, יחידה.",
  input_mode: "matrix",
  supports_matrix: true,
  default_validation_behavior: null,
  schema: {
    input_mode: "matrix",
    columns: [
      {
        key: "additive_name",
        label_he: "תוסף",
        label_en: "Additive",
        field_type: "select",
        required: true,
        options: ["Salt", "Sugar", "Xanthan (קסנטן)"],
      },
      {
        key: "amount",
        label_he: "כמות",
        label_en: "Amount",
        field_type: "number",
        required: true,
      },
      {
        key: "unit",
        label_he: "יחידה",
        label_en: "Unit",
        field_type: "select",
        required: true,
        options: ["kg", "g", "L", "mL"],
      },
      {
        key: "batch_code",
        label_he: "קוד אצווה תוסף",
        label_en: "Additive batch code",
        field_type: "text",
        required: false,
      },
    ],
  },
};

const breakingFiltration: StepDefinitionSeed = {
  id: GLOBAL_STEP_DEFINITION_IDS.breaking_filtration,
  code: "breaking_filtration",
  step_type: "execution",
  name_he: "סינון",
  name_en: "Filtration",
  description: null,
  input_mode: "single_form",
  supports_matrix: false,
  default_validation_behavior: null,
  schema: {
    input_mode: "single_form",
    fields: [
      {
        key: "filter_type",
        label_he: "סוג מסנן",
        label_en: "Filter type",
        field_type: "text",
        required: true,
      },
      {
        key: "pressure_bar",
        label_he: "לחץ (בר)",
        label_en: "Pressure (bar)",
        field_type: "pressure",
        required: false,
      },
      {
        key: "duration_minutes",
        label_he: "משך (דקות)",
        label_en: "Duration (min)",
        field_type: "integer",
        required: false,
      },
      {
        key: "operator_name",
        label_he: "מפעיל",
        label_en: "Operator",
        field_type: "text",
        required: true,
      },
    ],
  },
};

const breakingCooling: StepDefinitionSeed = {
  id: GLOBAL_STEP_DEFINITION_IDS.breaking_cooling,
  code: "breaking_cooling",
  step_type: "measurement",
  name_he: "קירור",
  name_en: "Cooling",
  description: null,
  input_mode: "single_form",
  supports_matrix: false,
  default_validation_behavior: null,
  schema: {
    input_mode: "single_form",
    fields: [
      {
        key: "temperature_c",
        label_he: "טמפרטורה (°C)",
        label_en: "Temperature (°C)",
        field_type: "temperature",
        required: true,
        unit: "°C",
      },
      {
        key: "reading_time",
        label_he: "שעת קריאה",
        label_en: "Reading time",
        field_type: "datetime",
        required: true,
      },
      {
        key: "location",
        label_he: "מיקום / מיכל",
        label_en: "Location / vessel",
        field_type: "text",
        required: false,
      },
    ],
  },
};

const breakingIntermediateStorage: StepDefinitionSeed = {
  id: GLOBAL_STEP_DEFINITION_IDS.breaking_intermediate_storage,
  code: "breaking_intermediate_storage",
  step_type: "execution",
  name_he: "אחסון ביניים",
  name_en: "Intermediate storage",
  description: null,
  input_mode: "single_form",
  supports_matrix: false,
  default_validation_behavior: null,
  schema: {
    input_mode: "single_form",
    fields: [
      {
        key: "vessel_code",
        label_he: "קוד מיכל / סילו",
        label_en: "Vessel / silo code",
        field_type: "text",
        required: true,
      },
      {
        key: "quantity_kg",
        label_he: 'כמות מועברת (ק"ג)',
        label_en: "Transferred quantity (kg)",
        field_type: "number",
        required: true,
      },
      {
        key: "transfer_completed_at",
        label_he: "סיום העברה",
        label_en: "Transfer completed at",
        field_type: "datetime",
        required: true,
      },
      {
        key: "operator_name",
        label_he: "מפעיל",
        label_en: "Operator",
        field_type: "text",
        required: true,
      },
    ],
  },
};

const prePasteurizationReadiness: StepDefinitionSeed = {
  id: GLOBAL_STEP_DEFINITION_IDS.pre_pasteurization_readiness,
  code: "pre_pasteurization_readiness",
  step_type: "plan",
  name_he: "מוכנות לפני פסטור",
  name_en: "Pre-pasteurization readiness",
  description: "צ'ק-ליסט מוכנות לפני תחילת פסטור.",
  input_mode: "single_form",
  supports_matrix: false,
  default_validation_behavior: null,
  schema: {
    input_mode: "single_form",
    fields: [
      {
        key: "equipment_ok",
        label_he: "ציוד תקין",
        label_en: "Equipment OK",
        field_type: "boolean",
        required: true,
      },
      {
        key: "lines_flushed",
        label_he: "קווים שוטפו",
        label_en: "Lines flushed",
        field_type: "boolean",
        required: true,
      },
      {
        key: "operator_name",
        label_he: "מפעיל",
        label_en: "Operator",
        field_type: "text",
        required: true,
      },
      {
        key: "notes",
        label_he: "הערות",
        label_en: "Notes",
        field_type: "textarea",
        required: false,
      },
    ],
  },
};

const pasteurizationPhaseMarker: StepDefinitionSeed = {
  id: GLOBAL_STEP_DEFINITION_IDS.pasteurization_phase_marker,
  code: "pasteurization_phase_marker",
  step_type: "plan",
  name_he: "סימון שלב פסטור",
  name_en: "Pasteurization phase marker",
  description: "סימון מעבר לשלב פסטור (מינימלי).",
  input_mode: "single_form",
  supports_matrix: false,
  default_validation_behavior: null,
  schema: {
    input_mode: "single_form",
    fields: [
      {
        key: "marker_acknowledged",
        label_he: "אושר מעבר לשלב",
        label_en: "Phase acknowledged",
        field_type: "boolean",
        required: true,
      },
      {
        key: "marked_at",
        label_he: "מועד סימון",
        label_en: "Marked at",
        field_type: "datetime",
        required: true,
      },
    ],
  },
};

const pasteurizationExecution: StepDefinitionSeed = {
  id: GLOBAL_STEP_DEFINITION_IDS.pasteurization_execution,
  code: "pasteurization_execution",
  step_type: "execution",
  name_he: "ביצוע פסטור",
  name_en: "Pasteurization execution",
  description: null,
  input_mode: "single_form",
  supports_matrix: false,
  default_validation_behavior: null,
  schema: {
    input_mode: "single_form",
    fields: [
      {
        key: "batch_code",
        label_he: "קוד אצווה",
        label_en: "Batch code",
        field_type: "text",
        required: true,
      },
      {
        key: "hold_temperature_c",
        label_he: "טמפ' החזקה (°C)",
        label_en: "Hold temperature (°C)",
        field_type: "temperature",
        required: true,
        unit: "°C",
      },
      {
        key: "hold_duration_seconds",
        label_he: "משך החזקה (שניות)",
        label_en: "Hold duration (s)",
        field_type: "integer",
        required: true,
      },
      {
        key: "flow_rate",
        label_he: "קצב זרימה",
        label_en: "Flow rate",
        field_type: "number",
        required: false,
      },
      {
        key: "operator_name",
        label_he: "מפעיל",
        label_en: "Operator",
        field_type: "text",
        required: true,
      },
    ],
  },
};

const pasteurizationCurveValidation: StepDefinitionSeed = {
  id: GLOBAL_STEP_DEFINITION_IDS.pasteurization_curve_validation,
  code: "pasteurization_curve_validation",
  step_type: "validation",
  name_he: "אימות עקומת פסטור",
  name_en: "Pasteurization curve validation",
  description: "אימות מול עקומת פסטור (הפניה לגרף / קובץ).",
  input_mode: "single_form",
  supports_matrix: false,
  default_validation_behavior: { mode: "strict" },
  schema: {
    input_mode: "single_form",
    fields: [
      {
        key: "graph_ref",
        label_he: "הפניה לגרף / קובץ",
        label_en: "Graph / file reference",
        field_type: "graph_ref",
        required: true,
      },
      {
        key: "result_ok",
        label_he: "תוצאה תקינה",
        label_en: "Result OK",
        field_type: "boolean",
        required: true,
      },
      {
        key: "reviewer_name",
        label_he: "בודק",
        label_en: "Reviewer",
        field_type: "text",
        required: true,
      },
      {
        key: "reviewed_at",
        label_he: "מועד בדיקה",
        label_en: "Reviewed at",
        field_type: "datetime",
        required: true,
      },
    ],
  },
};

const coolingCurveValidation: StepDefinitionSeed = {
  id: GLOBAL_STEP_DEFINITION_IDS.cooling_curve_validation,
  code: "cooling_curve_validation",
  step_type: "validation",
  name_he: "אימות עקומת קירור",
  name_en: "Cooling curve validation",
  description: "אימות מול עקומת קירור (הפניה לגרף / קובץ).",
  input_mode: "single_form",
  supports_matrix: false,
  default_validation_behavior: { mode: "strict" },
  schema: {
    input_mode: "single_form",
    fields: [
      {
        key: "graph_ref",
        label_he: "הפניה לגרף / קובץ",
        label_en: "Graph / file reference",
        field_type: "graph_ref",
        required: true,
      },
      {
        key: "result_ok",
        label_he: "תוצאה תקינה",
        label_en: "Result OK",
        field_type: "boolean",
        required: true,
      },
      {
        key: "reviewer_name",
        label_he: "בודק",
        label_en: "Reviewer",
        field_type: "text",
        required: true,
      },
      {
        key: "reviewed_at",
        label_he: "מועד בדיקה",
        label_en: "Reviewed at",
        field_type: "datetime",
        required: true,
      },
    ],
  },
};

/** Global template rows (`tenant_id` null at insert time). Order is not significant. */
export const globalStepDefinitionSeeds: StepDefinitionSeed[] = [
  breakingCrush,
  breakingTimeControl,
  breakingAdditives,
  breakingFiltration,
  breakingCooling,
  breakingIntermediateStorage,
  prePasteurizationReadiness,
  pasteurizationPhaseMarker,
  pasteurizationExecution,
  pasteurizationCurveValidation,
  coolingCurveValidation,
];

for (const seed of globalStepDefinitionSeeds) {
  stepDefinitionSeedSchema.parse(seed);
}

export const globalStepDefinitionsByCode: Record<string, StepDefinitionSeed> = Object.fromEntries(
  globalStepDefinitionSeeds.map((s) => [s.code, s]),
);
