-- Example: per-process matrix column defaults on process_steps (not step_definitions).
-- Merges `field_defaults` into existing parameterization for the 4035 v2 filtration/storage matrix step.

UPDATE public.process_steps ps
SET parameterization = COALESCE(ps.parameterization, '{}'::jsonb)
  || jsonb_build_object(
    'field_defaults',
    jsonb_build_object(
      'storage_vessel_no',
      'T-1'
    )
  )
FROM public.process_definitions pd
WHERE ps.process_definition_id = pd.id
  AND pd.tenant_id = 'dadec1ab-93ab-4152-8d03-e10b3cfd5e95'::uuid
  AND pd.code = 'pasteurized_egg_production'
  AND pd.version = '2.0'
  AND ps.step_definition_id = 'e7b3c2a1-0d4f-52e6-a7b8-9c0d1e2f3a13'::uuid;
