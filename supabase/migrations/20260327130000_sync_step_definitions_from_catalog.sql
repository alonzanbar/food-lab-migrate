-- Sync global step_definitions from TS catalog (tenant_id NULL).
-- Source: src/domain/process/seeds/all-step-definition-seeds.ts
-- Catalog sha256: f86ed12912abb1e27c9e07c65ab9349d96f600e9ee36f69d15206ad6f76e6591
-- Regenerate: npm run build (prebuild) or npm run generate:step-definitions-migration

INSERT INTO public.step_definitions (id, tenant_id, code, step_type, name_he, name_en, description, input_mode, schema, supports_matrix, default_validation_behavior)
VALUES (
  'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a01'::uuid,
  NULL,
  'breaking_crush',
  'execution'::public.step_type,
  'שבירה',
  'Breaking / crushing',
  'רישום ביצוע שבירה (כמות, מפעיל, הערות).',
  'single_form'::public.input_mode,
  '{"input_mode":"single_form","fields":[{"key":"batch_code","label_he":"קוד אצווה","label_en":"Batch code","field_type":"text","required":true},{"key":"operator_name","label_he":"מפעיל","label_en":"Operator","field_type":"text","required":true},{"key":"quantity_kg","label_he":"כמות (ק\"ג)","label_en":"Quantity (kg)","field_type":"number","required":true,"unit":"kg"},{"key":"started_at","label_he":"התחלה","label_en":"Started at","field_type":"datetime","required":false},{"key":"notes","label_he":"הערות","label_en":"Notes","field_type":"textarea","required":false}]}'::jsonb,
  false,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  code = EXCLUDED.code,
  step_type = EXCLUDED.step_type,
  name_he = EXCLUDED.name_he,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  input_mode = EXCLUDED.input_mode,
  schema = EXCLUDED.schema,
  supports_matrix = EXCLUDED.supports_matrix,
  default_validation_behavior = EXCLUDED.default_validation_behavior;

INSERT INTO public.step_definitions (id, tenant_id, code, step_type, name_he, name_en, description, input_mode, schema, supports_matrix, default_validation_behavior)
VALUES (
  'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a02'::uuid,
  NULL,
  'breaking_time_control',
  'measurement'::public.step_type,
  'בקרת זמן בין שלבים',
  'Time control between stages',
  NULL,
  'single_form'::public.input_mode,
  '{"input_mode":"single_form","fields":[{"key":"elapsed_minutes","label_he":"דקות שחלפו","label_en":"Elapsed (minutes)","field_type":"integer","required":true},{"key":"within_spec","label_he":"בטווח המותר","label_en":"Within allowed range","field_type":"boolean","required":true},{"key":"notes","label_he":"הערות","label_en":"Notes","field_type":"textarea","required":false}]}'::jsonb,
  false,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  code = EXCLUDED.code,
  step_type = EXCLUDED.step_type,
  name_he = EXCLUDED.name_he,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  input_mode = EXCLUDED.input_mode,
  schema = EXCLUDED.schema,
  supports_matrix = EXCLUDED.supports_matrix,
  default_validation_behavior = EXCLUDED.default_validation_behavior;

INSERT INTO public.step_definitions (id, tenant_id, code, step_type, name_he, name_en, description, input_mode, schema, supports_matrix, default_validation_behavior)
VALUES (
  'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a03'::uuid,
  NULL,
  'breaking_additives',
  'execution'::public.step_type,
  'תוספות',
  'Additives',
  'מטריצת שורות: חומר, כמות, יחידה.',
  'matrix'::public.input_mode,
  '{"input_mode":"matrix","columns":[{"key":"additive_name","label_he":"תוסף","label_en":"Additive","field_type":"select","required":true,"options":["מלח","חומצה","תרבית","אחר"]},{"key":"amount","label_he":"כמות","label_en":"Amount","field_type":"number","required":true},{"key":"unit","label_he":"יחידה","label_en":"Unit","field_type":"select","required":true,"options":["kg","g","L","mL"]},{"key":"batch_code","label_he":"קוד אצווה תוסף","label_en":"Additive batch code","field_type":"text","required":false}]}'::jsonb,
  true,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  code = EXCLUDED.code,
  step_type = EXCLUDED.step_type,
  name_he = EXCLUDED.name_he,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  input_mode = EXCLUDED.input_mode,
  schema = EXCLUDED.schema,
  supports_matrix = EXCLUDED.supports_matrix,
  default_validation_behavior = EXCLUDED.default_validation_behavior;

INSERT INTO public.step_definitions (id, tenant_id, code, step_type, name_he, name_en, description, input_mode, schema, supports_matrix, default_validation_behavior)
VALUES (
  'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a04'::uuid,
  NULL,
  'breaking_filtration',
  'execution'::public.step_type,
  'סינון',
  'Filtration',
  NULL,
  'single_form'::public.input_mode,
  '{"input_mode":"single_form","fields":[{"key":"filter_type","label_he":"סוג מסנן","label_en":"Filter type","field_type":"text","required":true},{"key":"pressure_bar","label_he":"לחץ (בר)","label_en":"Pressure (bar)","field_type":"pressure","required":false},{"key":"duration_minutes","label_he":"משך (דקות)","label_en":"Duration (min)","field_type":"integer","required":false},{"key":"operator_name","label_he":"מפעיל","label_en":"Operator","field_type":"text","required":true}]}'::jsonb,
  false,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  code = EXCLUDED.code,
  step_type = EXCLUDED.step_type,
  name_he = EXCLUDED.name_he,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  input_mode = EXCLUDED.input_mode,
  schema = EXCLUDED.schema,
  supports_matrix = EXCLUDED.supports_matrix,
  default_validation_behavior = EXCLUDED.default_validation_behavior;

INSERT INTO public.step_definitions (id, tenant_id, code, step_type, name_he, name_en, description, input_mode, schema, supports_matrix, default_validation_behavior)
VALUES (
  'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a05'::uuid,
  NULL,
  'breaking_cooling',
  'measurement'::public.step_type,
  'קירור',
  'Cooling',
  NULL,
  'single_form'::public.input_mode,
  '{"input_mode":"single_form","fields":[{"key":"temperature_c","label_he":"טמפרטורה (°C)","label_en":"Temperature (°C)","field_type":"temperature","required":true,"unit":"°C"},{"key":"reading_time","label_he":"שעת קריאה","label_en":"Reading time","field_type":"datetime","required":true},{"key":"location","label_he":"מיקום / מיכל","label_en":"Location / vessel","field_type":"text","required":false}]}'::jsonb,
  false,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  code = EXCLUDED.code,
  step_type = EXCLUDED.step_type,
  name_he = EXCLUDED.name_he,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  input_mode = EXCLUDED.input_mode,
  schema = EXCLUDED.schema,
  supports_matrix = EXCLUDED.supports_matrix,
  default_validation_behavior = EXCLUDED.default_validation_behavior;

INSERT INTO public.step_definitions (id, tenant_id, code, step_type, name_he, name_en, description, input_mode, schema, supports_matrix, default_validation_behavior)
VALUES (
  'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a06'::uuid,
  NULL,
  'breaking_intermediate_storage',
  'execution'::public.step_type,
  'אחסון ביניים',
  'Intermediate storage',
  NULL,
  'single_form'::public.input_mode,
  '{"input_mode":"single_form","fields":[{"key":"vessel_code","label_he":"קוד מיכל / סילו","label_en":"Vessel / silo code","field_type":"text","required":true},{"key":"quantity_kg","label_he":"כמות מועברת (ק\"ג)","label_en":"Transferred quantity (kg)","field_type":"number","required":true},{"key":"transfer_completed_at","label_he":"סיום העברה","label_en":"Transfer completed at","field_type":"datetime","required":true},{"key":"operator_name","label_he":"מפעיל","label_en":"Operator","field_type":"text","required":true}]}'::jsonb,
  false,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  code = EXCLUDED.code,
  step_type = EXCLUDED.step_type,
  name_he = EXCLUDED.name_he,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  input_mode = EXCLUDED.input_mode,
  schema = EXCLUDED.schema,
  supports_matrix = EXCLUDED.supports_matrix,
  default_validation_behavior = EXCLUDED.default_validation_behavior;

INSERT INTO public.step_definitions (id, tenant_id, code, step_type, name_he, name_en, description, input_mode, schema, supports_matrix, default_validation_behavior)
VALUES (
  'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a07'::uuid,
  NULL,
  'pre_pasteurization_readiness',
  'plan'::public.step_type,
  'מוכנות לפני פסטור',
  'Pre-pasteurization readiness',
  'צ''ק-ליסט מוכנות לפני תחילת פסטור.',
  'single_form'::public.input_mode,
  '{"input_mode":"single_form","fields":[{"key":"equipment_ok","label_he":"ציוד תקין","label_en":"Equipment OK","field_type":"boolean","required":true},{"key":"lines_flushed","label_he":"קווים שוטפו","label_en":"Lines flushed","field_type":"boolean","required":true},{"key":"operator_name","label_he":"מפעיל","label_en":"Operator","field_type":"text","required":true},{"key":"notes","label_he":"הערות","label_en":"Notes","field_type":"textarea","required":false}]}'::jsonb,
  false,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  code = EXCLUDED.code,
  step_type = EXCLUDED.step_type,
  name_he = EXCLUDED.name_he,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  input_mode = EXCLUDED.input_mode,
  schema = EXCLUDED.schema,
  supports_matrix = EXCLUDED.supports_matrix,
  default_validation_behavior = EXCLUDED.default_validation_behavior;

INSERT INTO public.step_definitions (id, tenant_id, code, step_type, name_he, name_en, description, input_mode, schema, supports_matrix, default_validation_behavior)
VALUES (
  'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a08'::uuid,
  NULL,
  'pasteurization_phase_marker',
  'plan'::public.step_type,
  'סימון שלב פסטור',
  'Pasteurization phase marker',
  'סימון מעבר לשלב פסטור (מינימלי).',
  'single_form'::public.input_mode,
  '{"input_mode":"single_form","fields":[{"key":"marker_acknowledged","label_he":"אושר מעבר לשלב","label_en":"Phase acknowledged","field_type":"boolean","required":true},{"key":"marked_at","label_he":"מועד סימון","label_en":"Marked at","field_type":"datetime","required":true}]}'::jsonb,
  false,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  code = EXCLUDED.code,
  step_type = EXCLUDED.step_type,
  name_he = EXCLUDED.name_he,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  input_mode = EXCLUDED.input_mode,
  schema = EXCLUDED.schema,
  supports_matrix = EXCLUDED.supports_matrix,
  default_validation_behavior = EXCLUDED.default_validation_behavior;

INSERT INTO public.step_definitions (id, tenant_id, code, step_type, name_he, name_en, description, input_mode, schema, supports_matrix, default_validation_behavior)
VALUES (
  'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a09'::uuid,
  NULL,
  'pasteurization_execution',
  'execution'::public.step_type,
  'ביצוע פסטור',
  'Pasteurization execution',
  NULL,
  'single_form'::public.input_mode,
  '{"input_mode":"single_form","fields":[{"key":"batch_code","label_he":"קוד אצווה","label_en":"Batch code","field_type":"text","required":true},{"key":"hold_temperature_c","label_he":"טמפ'' החזקה (°C)","label_en":"Hold temperature (°C)","field_type":"temperature","required":true,"unit":"°C"},{"key":"hold_duration_seconds","label_he":"משך החזקה (שניות)","label_en":"Hold duration (s)","field_type":"integer","required":true},{"key":"flow_rate","label_he":"קצב זרימה","label_en":"Flow rate","field_type":"number","required":false},{"key":"operator_name","label_he":"מפעיל","label_en":"Operator","field_type":"text","required":true}]}'::jsonb,
  false,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  code = EXCLUDED.code,
  step_type = EXCLUDED.step_type,
  name_he = EXCLUDED.name_he,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  input_mode = EXCLUDED.input_mode,
  schema = EXCLUDED.schema,
  supports_matrix = EXCLUDED.supports_matrix,
  default_validation_behavior = EXCLUDED.default_validation_behavior;

INSERT INTO public.step_definitions (id, tenant_id, code, step_type, name_he, name_en, description, input_mode, schema, supports_matrix, default_validation_behavior)
VALUES (
  'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a0a'::uuid,
  NULL,
  'pasteurization_curve_validation',
  'validation'::public.step_type,
  'אימות עקומת פסטור',
  'Pasteurization curve validation',
  'אימות מול עקומת פסטור (הפניה לגרף / קובץ).',
  'single_form'::public.input_mode,
  '{"input_mode":"single_form","fields":[{"key":"graph_ref","label_he":"הפניה לגרף / קובץ","label_en":"Graph / file reference","field_type":"graph_ref","required":true},{"key":"result_ok","label_he":"תוצאה תקינה","label_en":"Result OK","field_type":"boolean","required":true},{"key":"reviewer_name","label_he":"בודק","label_en":"Reviewer","field_type":"text","required":true},{"key":"reviewed_at","label_he":"מועד בדיקה","label_en":"Reviewed at","field_type":"datetime","required":true}]}'::jsonb,
  false,
  '{"mode":"strict"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  code = EXCLUDED.code,
  step_type = EXCLUDED.step_type,
  name_he = EXCLUDED.name_he,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  input_mode = EXCLUDED.input_mode,
  schema = EXCLUDED.schema,
  supports_matrix = EXCLUDED.supports_matrix,
  default_validation_behavior = EXCLUDED.default_validation_behavior;

INSERT INTO public.step_definitions (id, tenant_id, code, step_type, name_he, name_en, description, input_mode, schema, supports_matrix, default_validation_behavior)
VALUES (
  'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a0b'::uuid,
  NULL,
  'cooling_curve_validation',
  'validation'::public.step_type,
  'אימות עקומת קירור',
  'Cooling curve validation',
  'אימות מול עקומת קירור (הפניה לגרף / קובץ).',
  'single_form'::public.input_mode,
  '{"input_mode":"single_form","fields":[{"key":"graph_ref","label_he":"הפניה לגרף / קובץ","label_en":"Graph / file reference","field_type":"graph_ref","required":true},{"key":"result_ok","label_he":"תוצאה תקינה","label_en":"Result OK","field_type":"boolean","required":true},{"key":"reviewer_name","label_he":"בודק","label_en":"Reviewer","field_type":"text","required":true},{"key":"reviewed_at","label_he":"מועד בדיקה","label_en":"Reviewed at","field_type":"datetime","required":true}]}'::jsonb,
  false,
  '{"mode":"strict"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  code = EXCLUDED.code,
  step_type = EXCLUDED.step_type,
  name_he = EXCLUDED.name_he,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  input_mode = EXCLUDED.input_mode,
  schema = EXCLUDED.schema,
  supports_matrix = EXCLUDED.supports_matrix,
  default_validation_behavior = EXCLUDED.default_validation_behavior;

INSERT INTO public.step_definitions (id, tenant_id, code, step_type, name_he, name_en, description, input_mode, schema, supports_matrix, default_validation_behavior)
VALUES (
  'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a10'::uuid,
  NULL,
  'eggs_4035_v2_batch_definition',
  'plan'::public.step_type,
  'הגדרת אצווה',
  'Batch definition',
  NULL,
  'single_form'::public.input_mode,
  '{"input_mode":"single_form","fields":[{"key":"product_name","label_he":"שם המוצר","label_en":"Product name","field_type":"text","required":true},{"key":"batch_number","label_he":"מספר אצווה","label_en":"Batch number","field_type":"text","required":true},{"key":"production_date","label_he":"תאריך ייצור","label_en":"Production date","field_type":"date","required":true},{"key":"chilled","label_he":"מצונן","label_en":"Chilled","field_type":"boolean","required":false},{"key":"frozen","label_he":"קפוא","label_en":"Frozen","field_type":"boolean","required":false},{"key":"other_meal_note","label_he":"בתהליך למנה אחרת (משקל ומס'' מנה)","label_en":"In process for another portion (weight and portion no.)","field_type":"text","required":false}]}'::jsonb,
  false,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  code = EXCLUDED.code,
  step_type = EXCLUDED.step_type,
  name_he = EXCLUDED.name_he,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  input_mode = EXCLUDED.input_mode,
  schema = EXCLUDED.schema,
  supports_matrix = EXCLUDED.supports_matrix,
  default_validation_behavior = EXCLUDED.default_validation_behavior;

INSERT INTO public.step_definitions (id, tenant_id, code, step_type, name_he, name_en, description, input_mode, schema, supports_matrix, default_validation_behavior)
VALUES (
  'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a11'::uuid,
  NULL,
  'eggs_4035_v2_breaking_additives',
  'execution'::public.step_type,
  'חומר גלם / תוספים',
  'Raw materials / additives',
  NULL,
  'matrix'::public.input_mode,
  '{"input_mode":"matrix","columns":[{"key":"material_name","label_he":"שם החומר","label_en":"Material name","field_type":"text","required":false},{"key":"quantity_kg","label_he":"כמות בק\"ג","label_en":"Quantity (kg)","field_type":"number","required":false},{"key":"raw_lot","label_he":"אצווה","label_en":"Lot","field_type":"text","required":false},{"key":"worker_name_sig","label_he":"שם וחתימת עובד","label_en":"Employee name and signature","field_type":"text","required":false}]}'::jsonb,
  true,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  code = EXCLUDED.code,
  step_type = EXCLUDED.step_type,
  name_he = EXCLUDED.name_he,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  input_mode = EXCLUDED.input_mode,
  schema = EXCLUDED.schema,
  supports_matrix = EXCLUDED.supports_matrix,
  default_validation_behavior = EXCLUDED.default_validation_behavior;

INSERT INTO public.step_definitions (id, tenant_id, code, step_type, name_he, name_en, description, input_mode, schema, supports_matrix, default_validation_behavior)
VALUES (
  'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a12'::uuid,
  NULL,
  'eggs_4035_v2_breaking_time_control',
  'measurement'::public.step_type,
  'בקרת זמנים',
  'Time control',
  NULL,
  'single_form'::public.input_mode,
  '{"input_mode":"single_form","fields":[{"key":"breaking_end_time","label_he":"שעת סיום השבירה","label_en":"Breaking end time","field_type":"time","required":false},{"key":"cooling_entry_time","label_he":"שעת הכנסה לקירור","label_en":"Cooling entry time","field_type":"time","required":false},{"key":"pasteur_entry_time","label_he":"שעת הכנסה לפסטור","label_en":"Pasteurization entry time","field_type":"time","required":false},{"key":"worker_name_sig","label_he":"שם וחתימת עובד","label_en":"Employee name and signature","field_type":"text","required":false}]}'::jsonb,
  false,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  code = EXCLUDED.code,
  step_type = EXCLUDED.step_type,
  name_he = EXCLUDED.name_he,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  input_mode = EXCLUDED.input_mode,
  schema = EXCLUDED.schema,
  supports_matrix = EXCLUDED.supports_matrix,
  default_validation_behavior = EXCLUDED.default_validation_behavior;

INSERT INTO public.step_definitions (id, tenant_id, code, step_type, name_he, name_en, description, input_mode, schema, supports_matrix, default_validation_behavior)
VALUES (
  'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a13'::uuid,
  NULL,
  'eggs_4035_v2_filtration_storage',
  'execution'::public.step_type,
  'סינון קירור ואחסון',
  'Filtration, cooling and storage',
  NULL,
  'matrix'::public.input_mode,
  '{"input_mode":"matrix","columns":[{"key":"filter_size","label_he":"גודל הפילטר","label_en":"Filter size","field_type":"text","required":false},{"key":"storage_vessel_no","label_he":"מספר מיכל אחסון","label_en":"Storage vessel number","field_type":"text","required":false},{"key":"product_temp_in_vessel","label_he":"טמפ'' המוצר במיכל","label_en":"Product temperature in vessel","field_type":"temperature","required":false,"unit":"°C"},{"key":"quantity_in_vessel","label_he":"כמות במיכל","label_en":"Quantity in vessel","field_type":"number","required":false}]}'::jsonb,
  true,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  code = EXCLUDED.code,
  step_type = EXCLUDED.step_type,
  name_he = EXCLUDED.name_he,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  input_mode = EXCLUDED.input_mode,
  schema = EXCLUDED.schema,
  supports_matrix = EXCLUDED.supports_matrix,
  default_validation_behavior = EXCLUDED.default_validation_behavior;

INSERT INTO public.step_definitions (id, tenant_id, code, step_type, name_he, name_en, description, input_mode, schema, supports_matrix, default_validation_behavior)
VALUES (
  'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a14'::uuid,
  NULL,
  'eggs_4035_v2_pre_pasteur_alignment',
  'measurement'::public.step_type,
  'התאמה ואישור לפני פסטור',
  'Alignment and approval before pasteurization',
  NULL,
  'single_form'::public.input_mode,
  '{"input_mode":"single_form","fields":[{"key":"ph","label_he":"pH","label_en":"pH","field_type":"number","required":false},{"key":"brix","label_he":"בריקס","label_en":"Brix","field_type":"number","required":false},{"key":"taste","label_he":"טעם","label_en":"Taste","field_type":"text","required":false},{"key":"smell","label_he":"ריח","label_en":"Smell","field_type":"text","required":false},{"key":"foaming_approval","label_he":"אישור הקצפה (לפי דרישה)","label_en":"Foaming approval (as required)","field_type":"boolean","required":false},{"key":"lab_qa_approval","label_he":"אישור מעבדה/מ. איכות","label_en":"Lab / QA approval","field_type":"text","required":false}]}'::jsonb,
  false,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  code = EXCLUDED.code,
  step_type = EXCLUDED.step_type,
  name_he = EXCLUDED.name_he,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  input_mode = EXCLUDED.input_mode,
  schema = EXCLUDED.schema,
  supports_matrix = EXCLUDED.supports_matrix,
  default_validation_behavior = EXCLUDED.default_validation_behavior;

INSERT INTO public.step_definitions (id, tenant_id, code, step_type, name_he, name_en, description, input_mode, schema, supports_matrix, default_validation_behavior)
VALUES (
  'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a15'::uuid,
  NULL,
  'eggs_4035_v2_pasteurizer_setup',
  'execution'::public.step_type,
  'פסטור',
  'Pasteurization (equipment)',
  NULL,
  'matrix'::public.input_mode,
  '{"input_mode":"matrix","columns":[{"key":"pasteurizer_no","label_he":"מס'' מפסטרת","label_en":"Pasteurizer no.","field_type":"text","required":false},{"key":"pump_flow","label_he":"ספיקת משאבת פיסטור","label_en":"Pasteurization pump flow","field_type":"text","required":false},{"key":"manifold_pressure","label_he":"לחץ המגוון","label_en":"Manifold pressure","field_type":"text","required":false},{"key":"pasteur_temp","label_he":"טמפ'' פסטור","label_en":"Pasteurization temperature","field_type":"temperature","required":false,"unit":"°C"},{"key":"reversal_temp","label_he":"טמפ'' \"רוורסיה\"","label_en":"Reversal temperature","field_type":"temperature","required":false,"unit":"°C"}]}'::jsonb,
  true,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  code = EXCLUDED.code,
  step_type = EXCLUDED.step_type,
  name_he = EXCLUDED.name_he,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  input_mode = EXCLUDED.input_mode,
  schema = EXCLUDED.schema,
  supports_matrix = EXCLUDED.supports_matrix,
  default_validation_behavior = EXCLUDED.default_validation_behavior;

INSERT INTO public.step_definitions (id, tenant_id, code, step_type, name_he, name_en, description, input_mode, schema, supports_matrix, default_validation_behavior)
VALUES (
  'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a16'::uuid,
  NULL,
  'eggs_4035_v2_pasteurization_actual',
  'execution'::public.step_type,
  'תהליך פסטור בפועל',
  'Actual pasteurization process',
  NULL,
  'single_form'::public.input_mode,
  '{"input_mode":"single_form","fields":[{"key":"pasteur_start_time","label_he":"שעת תחילת פסטור","label_en":"Pasteurization start time","field_type":"time","required":false},{"key":"temp_1h_after","label_he":"טמפרטורה שעה לאחר פיסטור","label_en":"Temperature 1h after pasteurization","field_type":"temperature","required":false,"unit":"°C"},{"key":"temp_2h_after","label_he":"טמפרטורה שעתיים לאחר פיסטור","label_en":"Temperature 2h after pasteurization","field_type":"temperature","required":false,"unit":"°C"},{"key":"pasteur_end_time","label_he":"שעת סיום פסטור","label_en":"Pasteurization end time","field_type":"time","required":false},{"key":"pasteur_pressure","label_he":"לחץ פיסטור","label_en":"Pasteurization pressure","field_type":"pressure","required":false},{"key":"exit_temperature","label_he":"טמפרטורת יציאה","label_en":"Exit temperature","field_type":"temperature","required":false,"unit":"°C"},{"key":"corrective_action","label_he":"פעולה מתקנת","label_en":"Corrective action","field_type":"textarea","required":false},{"key":"dept_approver_sig","label_he":"שם וחתימת אישור מ. מחלקה","label_en":"Dept. manager approval name and signature","field_type":"text","required":false}]}'::jsonb,
  false,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  code = EXCLUDED.code,
  step_type = EXCLUDED.step_type,
  name_he = EXCLUDED.name_he,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  input_mode = EXCLUDED.input_mode,
  schema = EXCLUDED.schema,
  supports_matrix = EXCLUDED.supports_matrix,
  default_validation_behavior = EXCLUDED.default_validation_behavior;

INSERT INTO public.step_definitions (id, tenant_id, code, step_type, name_he, name_en, description, input_mode, schema, supports_matrix, default_validation_behavior)
VALUES (
  'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a17'::uuid,
  NULL,
  'eggs_4035_v2_ccp1_ccp2_verification',
  'validation'::public.step_type,
  'אימות פסטור CCP1 וצינון CCP2',
  'CCP1 pasteurization and CCP2 cooling verification',
  NULL,
  'single_form'::public.input_mode,
  '{"input_mode":"single_form","fields":[{"key":"verifier_name","label_he":"שם המאמת","label_en":"Verifier name","field_type":"text","required":false},{"key":"time_pasteur","label_he":"שעה","label_en":"Time (pasteur)","field_type":"time","required":false},{"key":"pasteur_temp","label_he":"טמפ'' הפסטור","label_en":"Pasteurization temperature","field_type":"temperature","required":false,"unit":"°C"},{"key":"time_cooling","label_he":"שעה","label_en":"Time (cooling)","field_type":"time","required":false},{"key":"cooling_temp","label_he":"טמפ'' צינון","label_en":"Cooling temperature","field_type":"temperature","required":false,"unit":"°C"},{"key":"verifier_sig","label_he":"שם וחתימת המאמת","label_en":"Verifier name and signature","field_type":"text","required":false}]}'::jsonb,
  false,
  '{"mode":"strict"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  code = EXCLUDED.code,
  step_type = EXCLUDED.step_type,
  name_he = EXCLUDED.name_he,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  input_mode = EXCLUDED.input_mode,
  schema = EXCLUDED.schema,
  supports_matrix = EXCLUDED.supports_matrix,
  default_validation_behavior = EXCLUDED.default_validation_behavior;

INSERT INTO public.step_definitions (id, tenant_id, code, step_type, name_he, name_en, description, input_mode, schema, supports_matrix, default_validation_behavior)
VALUES (
  'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a18'::uuid,
  NULL,
  'eggs_4035_v2_lab_graph_verification',
  'validation'::public.step_type,
  'אימות גרף פסטור וצינון (מעבדה)',
  'Lab verification of pasteurization and cooling graph',
  NULL,
  'single_form'::public.input_mode,
  '{"input_mode":"single_form","fields":[{"key":"graph_attached_status","label_he":"גרף פיסטור מצורף: תקין / לא תקין","label_en":"Attached pasteurization graph: OK / not OK","field_type":"select","required":false,"options":["תקין","לא תקין"]},{"key":"lab_manager_sig","label_he":"חתימת מנהלת המעבדה","label_en":"Laboratory manager signature","field_type":"text","required":false}]}'::jsonb,
  false,
  '{"mode":"strict"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  code = EXCLUDED.code,
  step_type = EXCLUDED.step_type,
  name_he = EXCLUDED.name_he,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  input_mode = EXCLUDED.input_mode,
  schema = EXCLUDED.schema,
  supports_matrix = EXCLUDED.supports_matrix,
  default_validation_behavior = EXCLUDED.default_validation_behavior;

INSERT INTO public.step_definitions (id, tenant_id, code, step_type, name_he, name_en, description, input_mode, schema, supports_matrix, default_validation_behavior)
VALUES (
  'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3c01'::uuid,
  NULL,
  'eggs_4035_v2_packaging_ultra_storage',
  'execution'::public.step_type,
  'אחסון אחרי פסטור (מיכל אולטרה-קליין)',
  'Post-pasteurization storage (ultra-clean vessel)',
  NULL,
  'matrix'::public.input_mode,
  '{"input_mode":"matrix","columns":[{"key":"ultra_vessel","label_he":"מיכל אולטרה","label_en":"Ultra-clean vessel","field_type":"text","required":false},{"key":"product_temp_in_vessel","label_he":"טמפ'' המוצר במיכל (עד 4 מע\"צ)","label_en":"Product temp in vessel (up to 4 °C)","field_type":"temperature","required":false,"unit":"°C"},{"key":"status_ok","label_he":"תקין /לא תקין","label_en":"OK / not OK","field_type":"select","required":false,"options":["תקין","לא תקין"]},{"key":"lab_production_approval","label_he":"אישור מעבדה/מ. ייצור","label_en":"Lab / production approval","field_type":"text","required":false}]}'::jsonb,
  true,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  code = EXCLUDED.code,
  step_type = EXCLUDED.step_type,
  name_he = EXCLUDED.name_he,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  input_mode = EXCLUDED.input_mode,
  schema = EXCLUDED.schema,
  supports_matrix = EXCLUDED.supports_matrix,
  default_validation_behavior = EXCLUDED.default_validation_behavior;

INSERT INTO public.step_definitions (id, tenant_id, code, step_type, name_he, name_en, description, input_mode, schema, supports_matrix, default_validation_behavior)
VALUES (
  'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3c02'::uuid,
  NULL,
  'eggs_4035_v2_packaging_line_ack',
  'execution'::public.step_type,
  'מכונת אריזה — פעולה מתקנת / מעבדה',
  'Packaging line — corrective / lab sign-off',
  NULL,
  'single_form'::public.input_mode,
  '{"input_mode":"single_form","fields":[{"key":"corrective_action","label_he":"פעולה מתקנת","label_en":"Corrective action","field_type":"textarea","required":false},{"key":"lab_name_signature","label_he":"שם וחתימת מעבדה","label_en":"Lab name and signature","field_type":"text","required":false}]}'::jsonb,
  false,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  code = EXCLUDED.code,
  step_type = EXCLUDED.step_type,
  name_he = EXCLUDED.name_he,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  input_mode = EXCLUDED.input_mode,
  schema = EXCLUDED.schema,
  supports_matrix = EXCLUDED.supports_matrix,
  default_validation_behavior = EXCLUDED.default_validation_behavior;

INSERT INTO public.step_definitions (id, tenant_id, code, step_type, name_he, name_en, description, input_mode, schema, supports_matrix, default_validation_behavior)
VALUES (
  'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3c03'::uuid,
  NULL,
  'eggs_4035_v2_packaging_bb_grid',
  'execution'::public.step_type,
  'מכונת אריזה',
  'Packaging machine',
  NULL,
  'matrix'::public.input_mode,
  '{"input_mode":"matrix","columns":[{"key":"col_godel_ariza","label_he":"גודל אריזה","label_en":"Package size","field_type":"text","required":false},{"key":"col_hataamat_ariza","label_he":"התאמת אריזה למוצר","label_en":"Package match to product","field_type":"text","required":false},{"key":"col_mispar_atsvot_balon","label_he":"מספר אצוות בלון גז","label_en":"Gas cylinder batch nos.","field_type":"text","required":false},{"key":"col_mispar_atsvot_sakit","label_he":"מספר אצוות שקית","label_en":"Bag batch nos.","field_type":"text","required":false},{"key":"col_mispar_atsvot_karton","label_he":"מספר אצוות קרטון","label_en":"Carton batch nos.","field_type":"text","required":false},{"key":"col_kamut_arizot","label_he":"כמות אריזות","label_en":"Number of packages","field_type":"number","required":false},{"key":"col_lishimush_ad","label_he":"לשימוש עד","label_en":"Use by","field_type":"date","required":false},{"key":"col_sahak_bekg","label_he":"סה\"כ בק\"ג","label_en":"Total (kg)","field_type":"number","required":false}]}'::jsonb,
  true,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  code = EXCLUDED.code,
  step_type = EXCLUDED.step_type,
  name_he = EXCLUDED.name_he,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  input_mode = EXCLUDED.input_mode,
  schema = EXCLUDED.schema,
  supports_matrix = EXCLUDED.supports_matrix,
  default_validation_behavior = EXCLUDED.default_validation_behavior;

INSERT INTO public.step_definitions (id, tenant_id, code, step_type, name_he, name_en, description, input_mode, schema, supports_matrix, default_validation_behavior)
VALUES (
  'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3c04'::uuid,
  NULL,
  'eggs_4035_v2_weighing_cooling',
  'measurement'::public.step_type,
  'בקרת שקילה וקירור',
  'Weighing and cooling control',
  NULL,
  'matrix'::public.input_mode,
  '{"input_mode":"matrix","columns":[{"key":"checker_name","label_he":"שם הבודק","label_en":"Checker name","field_type":"text","required":false},{"key":"check_time","label_he":"שעה","label_en":"Time","field_type":"time","required":false},{"key":"weight","label_he":"משקל","label_en":"Weight","field_type":"number","required":false},{"key":"temp","label_he":"טמפ''","label_en":"Temperature","field_type":"temperature","required":false,"unit":"°C"}]}'::jsonb,
  true,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  code = EXCLUDED.code,
  step_type = EXCLUDED.step_type,
  name_he = EXCLUDED.name_he,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  input_mode = EXCLUDED.input_mode,
  schema = EXCLUDED.schema,
  supports_matrix = EXCLUDED.supports_matrix,
  default_validation_behavior = EXCLUDED.default_validation_behavior;

INSERT INTO public.step_definitions (id, tenant_id, code, step_type, name_he, name_en, description, input_mode, schema, supports_matrix, default_validation_behavior)
VALUES (
  'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3c05'::uuid,
  NULL,
  'eggs_4035_v2_ccp3_lab_verification',
  'validation'::public.step_type,
  'אימות מעבדה לCCP3',
  'Laboratory verification for CCP3',
  NULL,
  'single_form'::public.input_mode,
  '{"input_mode":"single_form","fields":[{"key":"verifier_name","label_he":"שם המאמת","label_en":"Verifier name","field_type":"text","required":false},{"key":"temp","label_he":"טמפ''","label_en":"Temperature","field_type":"temperature","required":false,"unit":"°C"},{"key":"weight","label_he":"משקל","label_en":"Weight","field_type":"number","required":false},{"key":"name_and_signature","label_he":"שם וחתימה","label_en":"Name and signature","field_type":"text","required":false},{"key":"corrective_if_not_ok","label_he":"במידה ולא תקין – פעולה מתקנת","label_en":"If not OK — corrective action","field_type":"textarea","required":false}]}'::jsonb,
  false,
  '{"mode":"strict"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  code = EXCLUDED.code,
  step_type = EXCLUDED.step_type,
  name_he = EXCLUDED.name_he,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  input_mode = EXCLUDED.input_mode,
  schema = EXCLUDED.schema,
  supports_matrix = EXCLUDED.supports_matrix,
  default_validation_behavior = EXCLUDED.default_validation_behavior;

INSERT INTO public.step_definitions (id, tenant_id, code, step_type, name_he, name_en, description, input_mode, schema, supports_matrix, default_validation_behavior)
VALUES (
  'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3c06'::uuid,
  NULL,
  'eggs_4035_v2_packaging_carton_1kg',
  'execution'::public.step_type,
  'מכונת אריזה: 1 ק"ג קרטונית',
  'Packaging machine: 1 kg carton',
  NULL,
  'matrix'::public.input_mode,
  '{"input_mode":"matrix","columns":[{"key":"col_mispar_atsvot_karton","label_he":"מספר אצוות קרטון","label_en":"Carton batch nos.","field_type":"text","required":false},{"key":"col_ishur_hataama","label_he":"אישור התאמת אריזה למוצר","label_en":"Package fit approval","field_type":"text","required":false},{"key":"col_mispar_atsvot_balon","label_he":"מספר אצוות בלון גז","label_en":"Gas cylinder batch nos.","field_type":"text","required":false},{"key":"col_lishimush_ad","label_he":"לשימוש עד","label_en":"Use by","field_type":"date","required":false},{"key":"col_kamut","label_he":"כמות","label_en":"Quantity","field_type":"number","required":false},{"key":"col_sahak_bekg","label_he":"סה\"כ בק\"ג","label_en":"Total (kg)","field_type":"number","required":false}]}'::jsonb,
  true,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  code = EXCLUDED.code,
  step_type = EXCLUDED.step_type,
  name_he = EXCLUDED.name_he,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  input_mode = EXCLUDED.input_mode,
  schema = EXCLUDED.schema,
  supports_matrix = EXCLUDED.supports_matrix,
  default_validation_behavior = EXCLUDED.default_validation_behavior;

INSERT INTO public.step_definitions (id, tenant_id, code, step_type, name_he, name_en, description, input_mode, schema, supports_matrix, default_validation_behavior)
VALUES (
  'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3c07'::uuid,
  NULL,
  'eggs_4035_v2_freezer_priser',
  'execution'::public.step_type,
  'הקפאה בשוק פריז''ר',
  'Freezing in priser chamber',
  NULL,
  'matrix'::public.input_mode,
  '{"input_mode":"matrix","columns":[{"key":"package_size","label_he":"גודל אריזה","label_en":"Package size","field_type":"text","required":false},{"key":"use_by","label_he":"לשימוש עד","label_en":"Use by","field_type":"date","required":false},{"key":"total_kg","label_he":"סה\"כ בק\"ג","label_en":"Total (kg)","field_type":"number","required":false},{"key":"sterile_sample_saved","label_he":"נשמרה דוג'' סטרילית במעבדה. תקין / לא תקין","label_en":"Sterile sample saved in lab. OK / not OK","field_type":"select","required":false,"options":["תקין","לא תקין"]},{"key":"freeze_start_time","label_he":"שעת התחלת ההקפאה","label_en":"Freeze start time","field_type":"time","required":false},{"key":"temp_at_freeze_start","label_he":"טמפ'' המוצר בתחילת תהליך ההקפאה (עד 4 מע\"צ)","label_en":"Product temp at start of freezing (up to 4 °C)","field_type":"temperature","required":false,"unit":"°C"},{"key":"freeze_end_time","label_he":"שעת סיום ההקפאה (מקס'' 8 שעות)","label_en":"Freeze end time (max 8 hours)","field_type":"time","required":false},{"key":"temp_at_freeze_end","label_he":"טמפ'' בסיום ההקפאה (מינ'' 10- מע\"צ)","label_en":"Temp at end of freezing (min 10 °C)","field_type":"temperature","required":false,"unit":"°C"}]}'::jsonb,
  true,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  code = EXCLUDED.code,
  step_type = EXCLUDED.step_type,
  name_he = EXCLUDED.name_he,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  input_mode = EXCLUDED.input_mode,
  schema = EXCLUDED.schema,
  supports_matrix = EXCLUDED.supports_matrix,
  default_validation_behavior = EXCLUDED.default_validation_behavior;

INSERT INTO public.step_definitions (id, tenant_id, code, step_type, name_he, name_en, description, input_mode, schema, supports_matrix, default_validation_behavior)
VALUES (
  'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3c08'::uuid,
  NULL,
  'eggs_4035_v2_production_summary',
  'plan'::public.step_type,
  'סיכום ייצור',
  'Production summary',
  NULL,
  'single_form'::public.input_mode,
  '{"input_mode":"single_form","fields":[{"key":"product","label_he":"מוצר","label_en":"Product","field_type":"text","required":false},{"key":"portion_number","label_he":"מספר מנה","label_en":"Portion number","field_type":"text","required":false},{"key":"production_date","label_he":"ת.ייצור","label_en":"Production date","field_type":"date","required":false},{"key":"product_type","label_he":"סוג","label_en":"Type","field_type":"select","required":false,"options":["מצונן","קפוא"]},{"key":"overall_process_approval","label_he":"אישור כולל על תהליך הייצור","label_en":"Overall approval of production process","field_type":"textarea","required":false},{"key":"plant_qa_signature","label_he":"חתימת מ.מפעל/ מ. הבטחת איכות","label_en":"Plant manager / QA manager signature","field_type":"text","required":false}]}'::jsonb,
  false,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  code = EXCLUDED.code,
  step_type = EXCLUDED.step_type,
  name_he = EXCLUDED.name_he,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  input_mode = EXCLUDED.input_mode,
  schema = EXCLUDED.schema,
  supports_matrix = EXCLUDED.supports_matrix,
  default_validation_behavior = EXCLUDED.default_validation_behavior;

