-- Tenant-specific process graph: pasteurized egg production (דוח 4035-style flow).
-- Target tenant: dadec1ab-93ab-4152-8d03-e10b3cfd5e95
-- Requires: global step_definitions seed (e7b3c2a1-* IDs) already applied.

DO $$
DECLARE
  v_tenant UUID := 'dadec1ab-93ab-4152-8d03-e10b3cfd5e95';
  v_pd_id UUID;
  v_phase_breaking UUID;
  v_phase_past UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = v_tenant) THEN
    RAISE NOTICE 'Skipping pasteurized_egg_production seed: tenant % not found', v_tenant;
    RETURN;
  END IF;

  SELECT id INTO v_pd_id
  FROM public.process_definitions
  WHERE tenant_id = v_tenant
    AND code = 'pasteurized_egg_production'
    AND version = '1.0';

  IF v_pd_id IS NULL THEN
    INSERT INTO public.process_definitions (tenant_id, code, name_he, name_en, version, status)
    VALUES (
      v_tenant,
      'pasteurized_egg_production',
      'ייצור ביצים מפוסטרות',
      'Pasteurized egg production',
      '1.0',
      'published'::public.process_definition_status
    )
    RETURNING id INTO v_pd_id;
  END IF;

  SELECT id INTO v_phase_breaking
  FROM public.process_phases
  WHERE process_definition_id = v_pd_id AND code = 'breaking';

  IF v_phase_breaking IS NULL THEN
    INSERT INTO public.process_phases (process_definition_id, code, name_he, name_en, order_index)
    VALUES (
      v_pd_id,
      'breaking',
      'שלב א – שבירה',
      'Phase A – Breaking',
      1
    )
    RETURNING id INTO v_phase_breaking;
  END IF;

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
      2
    )
    RETURNING id INTO v_phase_past;
  END IF;

  -- process_steps: breaking phase (order 1–6)
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
  SELECT v_pd_id, v_phase_breaking, sd.id, o.ord, o.param::jsonb, o.uic::jsonb, true, false, false
  FROM (VALUES
    (1, 'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a01'::uuid, '{}'::text, null::text),
    (2, 'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a03'::uuid, '{}'::text, null::text),
    (3, 'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a02'::uuid, '{}'::text, null::text),
    (4, 'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a04'::uuid, '{}'::text, null::text),
    (5, 'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a05'::uuid, '{}'::text, null::text),
    (6, 'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a06'::uuid, '{}'::text, null::text)
  ) AS o(ord, step_id, param, uic)
  JOIN public.step_definitions sd ON sd.id = o.step_id
  WHERE NOT EXISTS (
    SELECT 1 FROM public.process_steps ps
    WHERE ps.process_phase_id = v_phase_breaking AND ps.order_index = o.ord
  );

  -- process_steps: pasteurization phase — CCP1 block on paper = instructions only (on execution step)
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
  SELECT v_pd_id, v_phase_past, sd.id, o.ord, o.param::jsonb, o.uic::jsonb, true, false, false
  FROM (VALUES
    (
      1,
      'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a07'::uuid,
      '{}'::text,
      null::text
    ),
    (
      2,
      'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a09'::uuid,
      $ctx$
      {
        "context": {
          "instructions_he": "ניטור CCP1 מבוצע בנקודת המדידה בסוף אזור ההשהיה (Holding). משך פסטור מינימלי: ≥4 דקות. טמפ' פסטור בהתאם לסוג המוצר.",
          "instructions_en": "CCP1 monitoring at the measurement point at the end of the holding zone. Minimum pasteurization duration: ≥4 minutes. Pasteurization temperature per product type."
        },
        "validation": {
          "mode": "strict"
        }
      }
      $ctx$::text,
      null::text
    ),
    (
      3,
      'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a0a'::uuid,
      '{"validation": {"mode": "strict"}}'::text,
      null::text
    ),
    (
      4,
      'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a0b'::uuid,
      '{"validation": {"mode": "strict"}}'::text,
      null::text
    )
  ) AS o(ord, step_id, param, uic)
  JOIN public.step_definitions sd ON sd.id = o.step_id
  WHERE NOT EXISTS (
    SELECT 1 FROM public.process_steps ps
    WHERE ps.process_phase_id = v_phase_past AND ps.order_index = o.ord
  );

END $$;
