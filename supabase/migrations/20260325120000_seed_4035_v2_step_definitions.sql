-- Global step_definitions for דוח 4035 process v2 (pasteurized eggs).
-- Source of truth: src/domain/process/seeds/steps/catalog-4035-v2.ts

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
);

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
);

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
);

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
);

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
);

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
);

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
);

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
);

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
);
