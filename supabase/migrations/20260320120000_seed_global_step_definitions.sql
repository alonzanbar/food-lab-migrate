-- Global step_definitions seed (tenant_id NULL).
-- Source of truth: src/domain/process/seeds/steps/catalog.ts
-- Regenerate: npm run seed:sql

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
);

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
);

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
);

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
);

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
);

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
);

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
);

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
);

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
);

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
);

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
);

