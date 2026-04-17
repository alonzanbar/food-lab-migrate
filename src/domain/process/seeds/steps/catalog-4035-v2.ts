import { stepDefinitionSeedSchema } from "../../schemas";
import type { StepDefinitionSeed } from "../types";

/**
 * Stable UUIDs for דוח 4035 process v2 — keep in sync with:
 * - `supabase/migrations/20260325120000_seed_4035_v2_step_definitions.sql` (…3a10–3a18)
 * - `supabase/migrations/20260326120000_4035_v2_packaging_freezing_summary.sql` (…3c01–3c08)
 */
export const EGGS_4035_V2_STEP_IDS = {
  batch_definition: "e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a10",
  breaking_additives_doc: "e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a11",
  breaking_time_doc: "e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a12",
  filtration_storage_doc: "e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a13",
  pre_pasteur_alignment_doc: "e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a14",
  pasteurizer_setup_doc: "e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a15",
  pasteurization_actual_doc: "e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a16",
  ccp1_ccp2_verification_doc: "e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a17",
  lab_graph_verification_doc: "e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a18",
  /** שלב ג – אריזה, הקפאה, סיכום (4035 doc) */
  packaging_ultra_storage: "e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3c01",
  packaging_line_ack: "e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3c02",
  packaging_bb_grid: "e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3c03",
  weighing_cooling: "e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3c04",
  ccp3_lab_verification: "e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3c05",
  packaging_carton_1kg: "e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3c06",
  freezer_priser: "e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3c07",
  production_summary: "e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3c08",
} as const;

const batchDefinition: StepDefinitionSeed = {
  id: EGGS_4035_V2_STEP_IDS.batch_definition,
  code: "eggs_4035_v2_batch_definition",
  step_type: "plan",
  name_he: "הגדרת אצווה",
  name_en: "Batch definition",
  description: null,
  input_mode: "single_form",
  supports_matrix: false,
  default_validation_behavior: null,
  schema: {
    input_mode: "single_form",
    fields: [
      { key: "product_name", label_he: "שם המוצר", label_en: "Product name", field_type: "text", required: true },
      { key: "batch_number", label_he: "מספר אצווה", label_en: "Batch number", field_type: "text", required: true },
      { key: "production_date", label_he: "תאריך ייצור", label_en: "Production date", field_type: "date", required: true },
      { key: "chilled", label_he: "מצונן", label_en: "Chilled", field_type: "boolean", required: false },
      { key: "frozen", label_he: "קפוא", label_en: "Frozen", field_type: "boolean", required: false },
      {
        key: "other_meal_note",
        label_he: "בתהליך למנה אחרת (משקל ומס' מנה)",
        label_en: "In process for another portion (weight and portion no.)",
        field_type: "text",
        required: false,
      },
    ],
  },
};

const breakingAdditivesDoc: StepDefinitionSeed = {
  id: EGGS_4035_V2_STEP_IDS.breaking_additives_doc,
  code: "eggs_4035_v2_breaking_additives",
  step_type: "execution",
  name_he: "חומר גלם / תוספים",
  name_en: "Raw materials / additives",
  description: null,
  input_mode: "matrix",
  supports_matrix: true,
  default_validation_behavior: null,
  schema: {
    input_mode: "matrix",
    columns: [
      {
        key: "material_name",
        label_he: "שם החומר",
        label_en: "Material name",
        field_type: "select",
        required: false,
        options: ["Salt", "Sugar", "Xanthan (קסנטן)"],
      },
      { key: "quantity_kg", label_he: 'כמות בק"ג', label_en: "Quantity (kg)", field_type: "number", required: false },
      { key: "raw_lot", label_he: "אצווה", label_en: "Lot", field_type: "text", required: false },
      {
        key: "worker_name_sig",
        label_he: "שם וחתימת עובד",
        label_en: "Employee name and signature",
        field_type: "name_and_signature",
        required: false,
      },
    ],
  },
};

const breakingTimeDoc: StepDefinitionSeed = {
  id: EGGS_4035_V2_STEP_IDS.breaking_time_doc,
  code: "eggs_4035_v2_breaking_time_control",
  step_type: "measurement",
  name_he: "בקרת זמנים",
  name_en: "Time control",
  description: null,
  input_mode: "single_form",
  supports_matrix: false,
  default_validation_behavior: null,
  schema: {
    input_mode: "single_form",
    fields: [
      { key: "breaking_end_time", label_he: "שעת סיום השבירה", label_en: "Breaking end time", field_type: "time", required: false },
      { key: "cooling_entry_time", label_he: "שעת הכנסה לקירור", label_en: "Cooling entry time", field_type: "time", required: false },
      { key: "pasteur_entry_time", label_he: "שעת הכנסה לפסטור", label_en: "Pasteurization entry time", field_type: "time", required: false },
      {
        key: "worker_name_sig",
        label_he: "שם וחתימת עובד",
        label_en: "Employee name and signature",
        field_type: "name_and_signature",
        required: false,
      },
    ],
  },
};

const filtrationStorageDoc: StepDefinitionSeed = {
  id: EGGS_4035_V2_STEP_IDS.filtration_storage_doc,
  code: "eggs_4035_v2_filtration_storage",
  step_type: "execution",
  name_he: "סינון קירור ואחסון",
  name_en: "Filtration, cooling and storage",
  description: null,
  input_mode: "matrix",
  supports_matrix: true,
  default_validation_behavior: null,
  schema: {
    input_mode: "matrix",
    columns: [
      {
        key: "filter_size",
        label_he: "גודל הפילטר",
        label_en: "Filter size",
        field_type: "select",
        required: false,
        options: ["0.6", "0.9"],
      },
      {
        key: "storage_vessel_no",
        label_he: "מספר מיכל אחסון",
        label_en: "Storage vessel number",
        field_type: "select",
        required: false,
        options: ["1", "2", "3", "4"],
      },
      {
        key: "product_temp_in_vessel",
        label_he: "טמפ' המוצר במיכל",
        label_en: "Product temperature in vessel",
        field_type: "temperature",
        required: false,
        unit: "°C",
      },
      { key: "quantity_in_vessel", label_he: "כמות במיכל", label_en: "Quantity in vessel", field_type: "number", required: false },
    ],
  },
};

const prePasteurAlignmentDoc: StepDefinitionSeed = {
  id: EGGS_4035_V2_STEP_IDS.pre_pasteur_alignment_doc,
  code: "eggs_4035_v2_pre_pasteur_alignment",
  step_type: "measurement",
  name_he: "התאמה ואישור לפני פסטור",
  name_en: "Alignment and approval before pasteurization",
  description: null,
  input_mode: "single_form",
  supports_matrix: false,
  default_validation_behavior: null,
  schema: {
    input_mode: "single_form",
    fields: [
      { key: "ph", label_he: "pH", label_en: "pH", field_type: "number", required: false },
      { key: "brix", label_he: "בריקס", label_en: "Brix", field_type: "number", required: false },
      {
        key: "taste",
        label_he: "טעם",
        label_en: "Taste",
        field_type: "select",
        required: false,
        options: ["Approved", "Not approved"],
      },
      {
        key: "smell",
        label_he: "ריח",
        label_en: "Smell",
        field_type: "select",
        required: false,
        options: ["Approved", "Not approved"],
      },
      {
        key: "foaming_approval",
        label_he: "אישור לפני הקצפה",
        label_en: "Approval before foaming",
        field_type: "select",
        required: false,
        options: ["Approved", "Not approved"],
      },
      {
        key: "approval_name",
        label_he: "שם המאשר",
        label_en: "Approver name",
        field_type: "text",
        required: false,
      },
      {
        key: "lab_qa_approval",
        label_he: "אישור מעבדה/מ. איכות",
        label_en: "Lab / QA approval",
        field_type: "text",
        required: false,
      },
    ],
  },
};

const pasteurizerSetupDoc: StepDefinitionSeed = {
  id: EGGS_4035_V2_STEP_IDS.pasteurizer_setup_doc,
  code: "eggs_4035_v2_pasteurizer_setup",
  step_type: "execution",
  name_he: "פסטור",
  name_en: "Pasteurization (equipment)",
  description: null,
  input_mode: "matrix",
  supports_matrix: true,
  default_validation_behavior: null,
  schema: {
    input_mode: "matrix",
    columns: [
      {
        key: "pasteurizer_no",
        label_he: "מס' מפסטרת",
        label_en: "Pasteurizer no.",
        field_type: "integer",
        required: false,
        validation: { auto_row_index: true },
      },
      {
        key: "pump_flow",
        label_he: "ספיקת משאבת פיסטור",
        label_en: "Pasteurization pump flow",
        field_type: "text",
        required: false,
      },
      { key: "manifold_pressure", label_he: "לחץ המגוון", label_en: "Manifold pressure", field_type: "text", required: false },
      { key: "pasteur_temp", label_he: "טמפ' פסטור", label_en: "Pasteurization temperature", field_type: "temperature", required: false, unit: "°C" },
      {
        key: "reversal_temp",
        label_he: 'טמפ\' "רוורסיה"',
        label_en: 'Reversal temperature',
        field_type: "temperature",
        required: false,
        unit: "°C",
      },
    ],
  },
};

const pasteurizationActualDoc: StepDefinitionSeed = {
  id: EGGS_4035_V2_STEP_IDS.pasteurization_actual_doc,
  code: "eggs_4035_v2_pasteurization_actual",
  step_type: "execution",
  name_he: "תהליך פסטור בפועל",
  name_en: "Actual pasteurization process",
  description: null,
  input_mode: "single_form",
  supports_matrix: false,
  default_validation_behavior: null,
  schema: {
    input_mode: "single_form",
    fields: [
      { key: "pasteur_start_time", label_he: "שעת תחילת פסטור", label_en: "Pasteurization start time", field_type: "time", required: false },
      {
        key: "pressure_1h_after_start",
        label_he: "לחץ — שעה מתחילת פסטור",
        label_en: "Pressure — 1h after start",
        field_type: "pressure",
        required: false,
      },
      {
        key: "pressure_2h_after_start",
        label_he: "לחץ — שעתיים מתחילת פסטור",
        label_en: "Pressure — 2h after start",
        field_type: "pressure",
        required: false,
      },
      {
        key: "exit_temp_1h_after_start",
        label_he: "טמפ' יציאה — שעה מתחילת פסטור",
        label_en: "Exit temperature — 1h after start",
        field_type: "temperature",
        required: false,
        unit: "°C",
      },
      {
        key: "exit_temp_2h_after_start",
        label_he: "טמפ' יציאה — שעתיים מתחילת פסטור",
        label_en: "Exit temperature — 2h after start",
        field_type: "temperature",
        required: false,
        unit: "°C",
      },
      { key: "corrective_action", label_he: "פעולה מתקנת", label_en: "Corrective action", field_type: "textarea", required: false },
      {
        key: "dept_approver_sig",
        label_he: "שם וחתימת אישור מ. מחלקה",
        label_en: "Dept. manager approval name and signature",
        field_type: "name_and_signature",
        required: false,
      },
    ],
  },
};

const ccp1Ccp2VerificationDoc: StepDefinitionSeed = {
  id: EGGS_4035_V2_STEP_IDS.ccp1_ccp2_verification_doc,
  code: "eggs_4035_v2_ccp1_ccp2_verification",
  step_type: "validation",
  name_he: "אימות פסטור CCP1 וצינון CCP2",
  name_en: "CCP1 pasteurization and CCP2 cooling verification",
  description: null,
  input_mode: "single_form",
  supports_matrix: false,
  default_validation_behavior: { mode: "strict" },
  schema: {
    input_mode: "single_form",
    fields: [
      { key: "verifier_name", label_he: "שם המאמת", label_en: "Verifier name", field_type: "text", required: false },
      { key: "time_pasteur", label_he: "שעה", label_en: "Time (pasteur)", field_type: "time", required: false },
      {
        key: "pasteur_temp",
        label_he: "טמפ' הפסטור",
        label_en: "Pasteurization temperature",
        field_type: "temperature",
        required: false,
        unit: "°C",
      },
      { key: "time_cooling", label_he: "שעה", label_en: "Time (cooling)", field_type: "time", required: false },
      {
        key: "cooling_temp",
        label_he: "טמפ' צינון",
        label_en: "Cooling temperature",
        field_type: "temperature",
        required: false,
        unit: "°C",
      },
      {
        key: "verifier_sig",
        label_he: "שם וחתימת המאמת",
        label_en: "Verifier name and signature",
        field_type: "name_and_signature",
        required: false,
      },
    ],
  },
};

const packagingUltraStorage: StepDefinitionSeed = {
  id: EGGS_4035_V2_STEP_IDS.packaging_ultra_storage,
  code: "eggs_4035_v2_packaging_ultra_storage",
  step_type: "execution",
  name_he: "אחסון אחרי פסטור (מיכל אולטרה-קליין)",
  name_en: "Post-pasteurization storage (ultra-clean vessel)",
  description: null,
  input_mode: "matrix",
  supports_matrix: true,
  default_validation_behavior: null,
  schema: {
    input_mode: "matrix",
    columns: [
      {
        key: "ultra_vessel",
        label_he: "מיכל אולטרה",
        label_en: "Ultra-clean vessel",
        field_type: "select",
        required: false,
        options: ["1", "2"],
      },
      {
        key: "product_temp_in_vessel",
        label_he: "טמפ' המוצר במיכל (עד 4 מע\"צ)",
        label_en: "Product temp in vessel (up to 4 °C)",
        field_type: "temperature",
        required: false,
        unit: "°C",
      },
      {
        key: "status_ok",
        label_he: "תקין /לא תקין",
        label_en: "OK / not OK",
        field_type: "select",
        required: false,
        options: ["תקין", "לא תקין"],
      },
      {
        key: "lab_production_approval",
        label_he: "אישור מעבדה/מ. ייצור",
        label_en: "Lab / production approval",
        field_type: "text",
        required: false,
      },
    ],
  },
};

const packagingLineAck: StepDefinitionSeed = {
  id: EGGS_4035_V2_STEP_IDS.packaging_line_ack,
  code: "eggs_4035_v2_packaging_line_ack",
  step_type: "execution",
  name_he: "מכונת אריזה — פעולה מתקנת / מעבדה",
  name_en: "Packaging line — corrective / lab sign-off",
  description: null,
  input_mode: "single_form",
  supports_matrix: false,
  default_validation_behavior: null,
  schema: {
    input_mode: "single_form",
    fields: [
      { key: "corrective_action", label_he: "פעולה מתקנת", label_en: "Corrective action", field_type: "textarea", required: false },
      {
        key: "lab_name_signature",
        label_he: "שם וחתימת מעבדה",
        label_en: "Lab name and signature",
        field_type: "name_and_signature",
        required: false,
      },
    ],
  },
};

/** מכונת אריזה — כותרת טבלה בלבד מדוח 4035 (שורת כותרת אחרי שורת B.B). */
const packagingBbGrid: StepDefinitionSeed = {
  id: EGGS_4035_V2_STEP_IDS.packaging_bb_grid,
  code: "eggs_4035_v2_packaging_bb_grid",
  step_type: "execution",
  name_he: "מכונת אריזה",
  name_en: "Packaging machine",
  description: null,
  input_mode: "matrix",
  supports_matrix: true,
  default_validation_behavior: null,
  schema: {
    input_mode: "matrix",
    columns: [
      {
        key: "col_godel_ariza",
        label_he: "גודל אריזה",
        label_en: "Package size",
        field_type: "select",
        required: false,
        options: ["1", "5", "10", "18", "20", "1000"],
      },
      {
        key: "col_hataamat_ariza",
        label_he: "התאמת אריזה למוצר",
        label_en: "Package match to product",
        field_type: "select",
        required: false,
        options: ["כן", "לא"],
      },
      { key: "col_mispar_atsvot_balon", label_he: "מספר אצוות בלון גז", label_en: "Gas cylinder batch nos.", field_type: "text", required: false },
      { key: "col_mispar_atsvot_sakit", label_he: "מספר אצוות שקית", label_en: "Bag batch nos.", field_type: "text", required: false },
      { key: "col_mispar_atsvot_karton", label_he: "מספר אצוות קרטון", label_en: "Carton batch nos.", field_type: "text", required: false },
      { key: "col_kamut_arizot", label_he: "כמות אריזות", label_en: "Number of packages", field_type: "number", required: false },
      { key: "col_lishimush_ad", label_he: "לשימוש עד", label_en: "Use by", field_type: "date", required: false },
      { key: "col_sahak_bekg", label_he: 'סה"כ בק"ג', label_en: "Total (kg)", field_type: "number", required: false },
    ],
  },
};

const weighingCooling: StepDefinitionSeed = {
  id: EGGS_4035_V2_STEP_IDS.weighing_cooling,
  code: "eggs_4035_v2_weighing_cooling",
  step_type: "measurement",
  name_he: "בקרת שקילה וקירור",
  name_en: "Weighing and cooling control",
  description: null,
  input_mode: "matrix",
  supports_matrix: true,
  default_validation_behavior: null,
  schema: {
    input_mode: "matrix",
    columns: [
      { key: "checker_name", label_he: "שם הבודק", label_en: "Checker name", field_type: "text", required: false },
      { key: "check_time", label_he: "שעה", label_en: "Time", field_type: "time", required: false },
      { key: "weight", label_he: "משקל", label_en: "Weight", field_type: "number", required: false },
      { key: "temp", label_he: "טמפ'", label_en: "Temperature", field_type: "temperature", required: false, unit: "°C" },
    ],
  },
};

const ccp3LabVerification: StepDefinitionSeed = {
  id: EGGS_4035_V2_STEP_IDS.ccp3_lab_verification,
  code: "eggs_4035_v2_ccp3_lab_verification",
  step_type: "validation",
  name_he: "אימות מעבדה לCCP3",
  name_en: "Laboratory verification for CCP3",
  description: null,
  input_mode: "single_form",
  supports_matrix: false,
  default_validation_behavior: { mode: "strict" },
  schema: {
    input_mode: "single_form",
    fields: [
      { key: "verifier_name", label_he: "שם המאמת", label_en: "Verifier name", field_type: "text", required: false },
      { key: "temp", label_he: "טמפ'", label_en: "Temperature", field_type: "temperature", required: false, unit: "°C" },
      { key: "weight", label_he: "משקל", label_en: "Weight", field_type: "number", required: false },
      {
        key: "name_and_signature",
        label_he: "שם וחתימה",
        label_en: "Name and signature",
        field_type: "name_and_signature",
        required: false,
      },
      {
        key: "corrective_if_not_ok",
        label_he: "במידה ולא תקין – פעולה מתקנת",
        label_en: "If not OK — corrective action",
        field_type: "textarea",
        required: false,
      },
    ],
  },
};

/** מכונת אריזה 1 ק"ג קרטונית — כותרת טבלה בלבד מדוח 4035. */
const packagingCarton1kg: StepDefinitionSeed = {
  id: EGGS_4035_V2_STEP_IDS.packaging_carton_1kg,
  code: "eggs_4035_v2_packaging_carton_1kg",
  step_type: "execution",
  name_he: "מכונת אריזה: 1 ק\"ג קרטונית",
  name_en: "Packaging machine: 1 kg carton",
  description: null,
  input_mode: "matrix",
  supports_matrix: true,
  default_validation_behavior: null,
  schema: {
    input_mode: "matrix",
    columns: [
      { key: "col_mispar_atsvot_karton", label_he: "מספר אצוות קרטון", label_en: "Carton batch nos.", field_type: "text", required: false },
      {
        key: "col_ishur_hataama",
        label_he: "אישור התאמת אריזה למוצר",
        label_en: "Package fit approval",
        field_type: "select",
        required: false,
        options: ["כן", "לא"],
      },
      { key: "col_mispar_atsvot_balon", label_he: "מספר אצוות בלון גז", label_en: "Gas cylinder batch nos.", field_type: "text", required: false },
      { key: "col_lishimush_ad", label_he: "לשימוש עד", label_en: "Use by", field_type: "date", required: false },
      { key: "col_kamut", label_he: "כמות", label_en: "Quantity", field_type: "number", required: false },
      { key: "col_sahak_bekg", label_he: 'סה"כ בק"ג', label_en: "Total (kg)", field_type: "number", required: false },
    ],
  },
};

const freezerPriser: StepDefinitionSeed = {
  id: EGGS_4035_V2_STEP_IDS.freezer_priser,
  code: "eggs_4035_v2_freezer_priser",
  step_type: "execution",
  name_he: "הקפאה בשוק פריז'ר",
  name_en: "Freezing in priser chamber",
  description: null,
  input_mode: "matrix",
  supports_matrix: true,
  default_validation_behavior: null,
  schema: {
    input_mode: "matrix",
    columns: [
      { key: "package_size", label_he: "גודל אריזה", label_en: "Package size", field_type: "text", required: false },
      { key: "use_by", label_he: "לשימוש עד", label_en: "Use by", field_type: "date", required: false },
      { key: "total_kg", label_he: 'סה"כ בק"ג', label_en: "Total (kg)", field_type: "number", required: false },
      {
        key: "sterile_sample_saved",
        label_he: "נשמרה דוג' סטרילית במעבדה. תקין / לא תקין",
        label_en: "Sterile sample saved in lab. OK / not OK",
        field_type: "select",
        required: false,
        options: ["תקין", "לא תקין"],
      },
      { key: "freeze_start_time", label_he: "שעת התחלת ההקפאה", label_en: "Freeze start time", field_type: "time", required: false },
      {
        key: "temp_at_freeze_start",
        label_he: "טמפ' המוצר בתחילת תהליך ההקפאה (עד 4 מע\"צ)",
        label_en: "Product temp at start of freezing (up to 4 °C)",
        field_type: "temperature",
        required: false,
        unit: "°C",
      },
      {
        key: "freeze_end_time",
        label_he: "שעת סיום ההקפאה (מקס' 8 שעות)",
        label_en: "Freeze end time (max 8 hours)",
        field_type: "time",
        required: false,
      },
      {
        key: "temp_at_freeze_end",
        label_he: "טמפ' בסיום ההקפאה (מינ' 10- מע\"צ)",
        label_en: "Temp at end of freezing (min 10 °C)",
        field_type: "temperature",
        required: false,
        unit: "°C",
      },
    ],
  },
};

const productionSummary: StepDefinitionSeed = {
  id: EGGS_4035_V2_STEP_IDS.production_summary,
  code: "eggs_4035_v2_production_summary",
  step_type: "plan",
  name_he: "סיכום ייצור",
  name_en: "Production summary",
  description: null,
  input_mode: "single_form",
  supports_matrix: false,
  default_validation_behavior: null,
  schema: {
    input_mode: "single_form",
    fields: [
      { key: "product", label_he: "מוצר", label_en: "Product", field_type: "text", required: false },
      { key: "portion_number", label_he: "מספר מנה", label_en: "Portion number", field_type: "text", required: false },
      { key: "production_date", label_he: "ת.ייצור", label_en: "Production date", field_type: "date", required: false },
      {
        key: "product_type",
        label_he: "סוג",
        label_en: "Type",
        field_type: "select",
        required: false,
        options: ["מצונן", "קפוא"],
      },
      {
        key: "overall_process_approval",
        label_he: "אישור כולל על תהליך הייצור",
        label_en: "Overall approval of production process",
        field_type: "textarea",
        required: false,
      },
      {
        key: "plant_qa_signature",
        label_he: "חתימת מ.מפעל/ מ. הבטחת איכות",
        label_en: "Plant manager / QA manager signature",
        field_type: "name_and_signature",
        required: false,
      },
    ],
  },
};

const labGraphVerificationDoc: StepDefinitionSeed = {
  id: EGGS_4035_V2_STEP_IDS.lab_graph_verification_doc,
  code: "eggs_4035_v2_lab_graph_verification",
  step_type: "validation",
  name_he: "אימות גרף פסטור וצינון (מעבדה)",
  name_en: "Lab verification of pasteurization and cooling graph",
  description: null,
  input_mode: "single_form",
  supports_matrix: false,
  default_validation_behavior: { mode: "strict" },
  schema: {
    input_mode: "single_form",
    fields: [
      {
        key: "graph_verification",
        label_he: "אימות גרף",
        label_en: "Graph verification",
        field_type: "select",
        required: false,
        options: ["Approved", "Not approved"],
      },
      {
        key: "graph_image",
        label_he: "צילום גרף",
        label_en: "Graph photo",
        field_type: "image",
        required: false,
      },
      {
        key: "lab_manager_sig",
        label_he: "חתימת מנהלת המעבדה",
        label_en: "Laboratory manager signature",
        field_type: "name_and_signature",
        required: false,
      },
    ],
  },
};

export const eggs4035V2StepSeeds: StepDefinitionSeed[] = [
  batchDefinition,
  breakingAdditivesDoc,
  breakingTimeDoc,
  filtrationStorageDoc,
  prePasteurAlignmentDoc,
  pasteurizerSetupDoc,
  pasteurizationActualDoc,
  ccp1Ccp2VerificationDoc,
  labGraphVerificationDoc,
  packagingUltraStorage,
  packagingLineAck,
  packagingBbGrid,
  weighingCooling,
  ccp3LabVerification,
  packagingCarton1kg,
  freezerPriser,
  productionSummary,
];

for (const seed of eggs4035V2StepSeeds) {
  stepDefinitionSeedSchema.parse(seed);
}
