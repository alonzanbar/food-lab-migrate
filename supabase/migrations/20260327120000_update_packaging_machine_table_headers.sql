-- Align מכונת אריזה steps with Word table headers only (4035 doc).
-- Safe if rows already match (idempotent content update).

UPDATE public.step_definitions
SET
  name_he = 'מכונת אריזה',
  name_en = 'Packaging machine',
  schema = '{"input_mode":"matrix","columns":[{"key":"col_godel_ariza","label_he":"גודל אריזה","label_en":"Package size","field_type":"text","required":false},{"key":"col_hataamat_ariza","label_he":"התאמת אריזה למוצר","label_en":"Package match to product","field_type":"text","required":false},{"key":"col_mispar_atsvot_balon","label_he":"מספר אצוות בלון גז","label_en":"Gas cylinder batch nos.","field_type":"text","required":false},{"key":"col_mispar_atsvot_sakit","label_he":"מספר אצוות שקית","label_en":"Bag batch nos.","field_type":"text","required":false},{"key":"col_mispar_atsvot_karton","label_he":"מספר אצוות קרטון","label_en":"Carton batch nos.","field_type":"text","required":false},{"key":"col_kamut_arizot","label_he":"כמות אריזות","label_en":"Number of packages","field_type":"number","required":false},{"key":"col_lishimush_ad","label_he":"לשימוש עד","label_en":"Use by","field_type":"date","required":false},{"key":"col_sahak_bekg","label_he":"סה\"כ בק\"ג","label_en":"Total (kg)","field_type":"number","required":false}]}'::jsonb
WHERE id = 'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3c03'::uuid;

UPDATE public.step_definitions
SET
  name_he = 'מכונת אריזה: 1 ק"ג קרטונית',
  name_en = 'Packaging machine: 1 kg carton',
  schema = '{"input_mode":"matrix","columns":[{"key":"col_mispar_atsvot_karton","label_he":"מספר אצוות קרטון","label_en":"Carton batch nos.","field_type":"text","required":false},{"key":"col_ishur_hataama","label_he":"אישור התאמת אריזה למוצר","label_en":"Package fit approval","field_type":"text","required":false},{"key":"col_mispar_atsvot_balon","label_he":"מספר אצוות בלון גז","label_en":"Gas cylinder batch nos.","field_type":"text","required":false},{"key":"col_lishimush_ad","label_he":"לשימוש עד","label_en":"Use by","field_type":"date","required":false},{"key":"col_kamut","label_he":"כמות","label_en":"Quantity","field_type":"number","required":false},{"key":"col_sahak_bekg","label_he":"סה\"כ בק\"ג","label_en":"Total (kg)","field_type":"number","required":false}]}'::jsonb
WHERE id = 'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3c06'::uuid;
