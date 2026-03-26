-- 4035 v2 extension: שלב ג אריזה, הקפאה בפריז'ר, סיכום ייצור.
-- Source: src/domain/process/seeds/steps/catalog-4035-v2.ts (IDs …3c01–3c08)
-- Requires: pasteurized_egg_production v2.0 for tenant dadec1ab-93ab-4152-8d03-e10b3cfd5e95

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
);

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
);

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
);

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
);

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
);

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
);

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
);

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
);

DO $$
DECLARE
  v_tenant UUID := 'dadec1ab-93ab-4152-8d03-e10b3cfd5e95';
  v_pd_id UUID;
  v_phase_pkg UUID;
  v_phase_fr UUID;
  v_phase_sum UUID;
BEGIN
  SELECT id INTO v_pd_id
  FROM public.process_definitions
  WHERE tenant_id = v_tenant AND code = 'pasteurized_egg_production' AND version = '2.0';

  IF v_pd_id IS NULL THEN
    RAISE NOTICE 'Skipping 4035 v2 phases 4–6: process_definitions v2.0 not found for tenant %', v_tenant;
    RETURN;
  END IF;

  SELECT id INTO v_phase_pkg FROM public.process_phases WHERE process_definition_id = v_pd_id AND code = 'packaging';
  IF v_phase_pkg IS NULL THEN
    INSERT INTO public.process_phases (process_definition_id, code, name_he, name_en, order_index)
    VALUES (v_pd_id, 'packaging', 'שלב ג – אריזה', 'Phase C – Packaging', 4)
    RETURNING id INTO v_phase_pkg;
  END IF;

  SELECT id INTO v_phase_fr FROM public.process_phases WHERE process_definition_id = v_pd_id AND code = 'freezing';
  IF v_phase_fr IS NULL THEN
    INSERT INTO public.process_phases (process_definition_id, code, name_he, name_en, order_index)
    VALUES (v_pd_id, 'freezing', 'הקפאה בשוק פריז''ר', 'Freezing in priser chamber', 5)
    RETURNING id INTO v_phase_fr;
  END IF;

  SELECT id INTO v_phase_sum FROM public.process_phases WHERE process_definition_id = v_pd_id AND code = 'production_summary';
  IF v_phase_sum IS NULL THEN
    INSERT INTO public.process_phases (process_definition_id, code, name_he, name_en, order_index)
    VALUES (v_pd_id, 'production_summary', 'סיכום ייצור', 'Production summary', 6)
    RETURNING id INTO v_phase_sum;
  END IF;

  INSERT INTO public.process_steps (process_definition_id, process_phase_id, step_definition_id, order_index, parameterization, ui_config, required, repeatable, skippable)
  SELECT v_pd_id, v_phase_pkg, sd.id, o.ord, o.param::jsonb, NULL, true, false, false
  FROM (VALUES
    (1, 'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3c01'::uuid, '{}'::text),
    (
      2,
      'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3c02'::uuid,
      '{"context":{"instructions_he":"מכונת אריזה: B.B מספר 1: B.B מספר 2: שם אחראי תחנה","instructions_en":"Packaging machine: B.B no. 1, B.B no. 2, station responsible"}}'::text
    ),
    (
      3,
      'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3c03'::uuid,
      '{"context":{"instructions_he":"התאמת אריזה למוצר כוללת: סוג המוצר, גודל, אריזה חיצונית ופנימית, כשרות, תאריך תפוגה","instructions_en":"Package match includes: product type, size, outer and inner packaging, kosher, expiry date"}}'::text
    ),
    (
      4,
      'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3c04'::uuid,
      '{"context":{"instructions_he":"בקרת שקילה וקירור","instructions_en":"Weighing and cooling control"}}'::text
    ),
    (
      5,
      'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3c05'::uuid,
      '{"context":{"instructions_he":"מאמת CCP בשעות שהמעבדה לא פועלת יהיה מנהל מחלקת פסטור","instructions_en":"When the lab is closed, pasteurization department manager acts as CCP verifier"}}'::text
    ),
    (
      6,
      'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3c06'::uuid,
      '{"context":{"instructions_he":"מכונת אריזה: 1 ק\"ג קרטונית שם אחראי תחנה","instructions_en":"Packaging machine: 1 kg carton, station responsible"}}'::text
    ),
    (
      7,
      'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3c04'::uuid,
      '{"context":{"instructions_he":"בקרת שקילה וקירור","instructions_en":"Weighing and cooling control"}}'::text
    ),
    (
      8,
      'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3c05'::uuid,
      '{"context":{"instructions_he":"מאמת CCP בשעות שהמעבדה לא פועלת יהיה מנהל מחלקת פסטור","instructions_en":"When the lab is closed, pasteurization department manager acts as CCP verifier"}}'::text
    )
  ) AS o(ord, step_id, param)
  JOIN public.step_definitions sd ON sd.id = o.step_id
  WHERE NOT EXISTS (SELECT 1 FROM public.process_steps ps WHERE ps.process_phase_id = v_phase_pkg AND ps.order_index = o.ord);

  INSERT INTO public.process_steps (process_definition_id, process_phase_id, step_definition_id, order_index, parameterization, ui_config, required, repeatable, skippable)
  SELECT v_pd_id, v_phase_fr, sd.id, 1, '{}'::jsonb, NULL, true, false, false
  FROM public.step_definitions sd
  WHERE sd.id = 'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3c07'::uuid
  AND NOT EXISTS (SELECT 1 FROM public.process_steps ps WHERE ps.process_phase_id = v_phase_fr AND ps.order_index = 1);

  INSERT INTO public.process_steps (process_definition_id, process_phase_id, step_definition_id, order_index, parameterization, ui_config, required, repeatable, skippable)
  SELECT v_pd_id, v_phase_sum, sd.id, 1, '{}'::jsonb, NULL, true, false, false
  FROM public.step_definitions sd
  WHERE sd.id = 'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3c08'::uuid
  AND NOT EXISTS (SELECT 1 FROM public.process_steps ps WHERE ps.process_phase_id = v_phase_sum AND ps.order_index = 1);

END $$;
