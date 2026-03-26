-- Tenant process v2: דוח 4035 (3 phases — batch, breaking, pasteurization incl. prep).
-- Target tenant: dadec1ab-93ab-4152-8d03-e10b3cfd5e95
-- Requires: 20260325120000_seed_4035_v2_step_definitions.sql
-- Leaves v1.0 process_definitions unchanged (new version = 2.0).

DO $$
DECLARE
  v_tenant UUID := 'dadec1ab-93ab-4152-8d03-e10b3cfd5e95';
  v_pd_id UUID;
  v_phase_batch UUID;
  v_phase_breaking UUID;
  v_phase_past UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = v_tenant) THEN
    RAISE NOTICE 'Skipping pasteurized_egg_production v2 seed: tenant % not found', v_tenant;
    RETURN;
  END IF;

  SELECT id INTO v_pd_id
  FROM public.process_definitions
  WHERE tenant_id = v_tenant
    AND code = 'pasteurized_egg_production'
    AND version = '2.0';

  IF v_pd_id IS NULL THEN
    INSERT INTO public.process_definitions (tenant_id, code, name_he, name_en, version, status)
    VALUES (
      v_tenant,
      'pasteurized_egg_production',
      'ייצור ביצים מפוסטרות',
      'Pasteurized egg production',
      '2.0',
      'published'::public.process_definition_status
    )
    RETURNING id INTO v_pd_id;
  END IF;

  -- Phase 1: batch definition
  SELECT id INTO v_phase_batch
  FROM public.process_phases
  WHERE process_definition_id = v_pd_id AND code = 'batch_definition';

  IF v_phase_batch IS NULL THEN
    INSERT INTO public.process_phases (process_definition_id, code, name_he, name_en, order_index)
    VALUES (
      v_pd_id,
      'batch_definition',
      'הגדרת אצווה',
      'Batch definition',
      1
    )
    RETURNING id INTO v_phase_batch;
  END IF;

  -- Phase 2: breaking
  SELECT id INTO v_phase_breaking
  FROM public.process_phases
  WHERE process_definition_id = v_pd_id AND code = 'breaking';

  IF v_phase_breaking IS NULL THEN
    INSERT INTO public.process_phases (process_definition_id, code, name_he, name_en, order_index)
    VALUES (
      v_pd_id,
      'breaking',
      'שלב ב – שבירה',
      'Phase B – Breaking',
      2
    )
    RETURNING id INTO v_phase_breaking;
  END IF;

  -- Phase 3: pasteurization (incl. preparation)
  SELECT id INTO v_phase_past
  FROM public.process_phases
  WHERE process_definition_id = v_pd_id AND code = 'pasteurization';

  IF v_phase_past IS NULL THEN
    INSERT INTO public.process_phases (process_definition_id, code, name_he, name_en, order_index)
    VALUES (
      v_pd_id,
      'pasteurization',
      'שלב ב – פסטור',
      'Phase B – Pasteurization',
      3
    )
    RETURNING id INTO v_phase_past;
  END IF;

  -- Phase 1 steps
  INSERT INTO public.process_steps (
    process_definition_id,
    process_phase_id,
    step_definition_id,
    order_index,
    parameterization,
    ui_config,
    required,
    repeatable,
    skippable
  )
  SELECT v_pd_id, v_phase_batch, sd.id, 1, '{}'::jsonb, NULL, true, false, false
  FROM public.step_definitions sd
  WHERE sd.id = 'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a10'::uuid
  AND NOT EXISTS (
    SELECT 1 FROM public.process_steps ps
    WHERE ps.process_phase_id = v_phase_batch AND ps.order_index = 1
  );

  -- Phase 2 steps
  INSERT INTO public.process_steps (
    process_definition_id,
    process_phase_id,
    step_definition_id,
    order_index,
    parameterization,
    ui_config,
    required,
    repeatable,
    skippable
  )
  SELECT v_pd_id, v_phase_breaking, sd.id, o.ord, o.param::jsonb, NULL, true, false, false
  FROM (VALUES
    (
      1,
      'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a11'::uuid,
      '{"context":{"instructions_he":"חומר גלם: ביצים טריות (משטחים) – תוספים","instructions_en":"Raw material: fresh eggs (trays) – additives"}}'::text
    ),
    (
      2,
      'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a12'::uuid,
      '{}'::text
    ),
    (
      3,
      'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a13'::uuid,
      '{"context":{"instructions_he":"במידה ויש שימוש ביותר ממיכל אחד לאצוות ייצור, יש לרשום כל מיכל בשורה נפרדת.","instructions_en":"If more than one vessel is used for the production batch, record each vessel on a separate row."}}'::text
    )
  ) AS o(ord, step_id, param)
  JOIN public.step_definitions sd ON sd.id = o.step_id
  WHERE NOT EXISTS (
    SELECT 1 FROM public.process_steps ps
    WHERE ps.process_phase_id = v_phase_breaking AND ps.order_index = o.ord
  );

  -- Phase 3 steps
  INSERT INTO public.process_steps (
    process_definition_id,
    process_phase_id,
    step_definition_id,
    order_index,
    parameterization,
    ui_config,
    required,
    repeatable,
    skippable
  )
  SELECT v_pd_id, v_phase_past, sd.id, o.ord, o.param::jsonb, NULL, true, false, false
  FROM (VALUES
    (1, 'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a14'::uuid, '{}'::text),
    (2, 'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a15'::uuid, '{}'::text),
    (
      3,
      'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a16'::uuid,
      '{"context":{"instructions_he":"ניטור CCP1 מבוצע בנקודת המדידה בסוף אזור ההשהיה (Holding). משך פסטור מינימלי: ≥4 דקות. טמפ'' פסטור בהתאם לסוג המוצר.","instructions_en":"CCP1 monitoring at the measurement point at the end of the holding zone. Minimum pasteurization duration: ≥4 minutes. Pasteurization temperature per product type."}}'::text
    ),
    (4, 'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a17'::uuid, '{}'::text),
    (
      5,
      'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a18'::uuid,
      '{"context":{"instructions_he":"אימות גרף פסטור CCP1 וצינון CCP2 ע\"י המעבדה:","instructions_en":"Verification of pasteurization graph CCP1 and cooling CCP2 by the laboratory:"}}'::text
    )
  ) AS o(ord, step_id, param)
  JOIN public.step_definitions sd ON sd.id = o.step_id
  WHERE NOT EXISTS (
    SELECT 1 FROM public.process_steps ps
    WHERE ps.process_phase_id = v_phase_past AND ps.order_index = o.ord
  );

END $$;
