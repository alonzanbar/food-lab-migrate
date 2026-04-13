-- Completing the process step marked is_final_step always closes the run (no guard on other required steps).

CREATE OR REPLACE FUNCTION public.on_process_step_run_completed_finalize_run()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_final boolean;
  v_run record;
  v_completed_at timestamptz;
BEGIN
  IF new.status IS DISTINCT FROM 'completed'::public.process_step_run_status THEN
    RETURN new;
  END IF;

  IF old.status IS NOT DISTINCT FROM 'completed'::public.process_step_run_status THEN
    RETURN new;
  END IF;

  SELECT ps.is_final_step INTO v_is_final
  FROM public.process_steps ps
  WHERE ps.id = new.process_step_id;

  IF NOT COALESCE(v_is_final, false) THEN
    RETURN new;
  END IF;

  SELECT
    pr.id,
    pr.tenant_id,
    pr.process_definition_id,
    pr.status,
    pr.batch_ref
  INTO v_run
  FROM public.process_runs pr
  WHERE pr.id = new.process_run_id;

  IF NOT FOUND THEN
    RETURN new;
  END IF;

  IF v_run.status = 'completed'::public.process_run_status THEN
    RETURN new;
  END IF;

  IF v_run.status NOT IN (
    'pending'::public.process_run_status,
    'in_progress'::public.process_run_status
  ) THEN
    RETURN new;
  END IF;

  UPDATE public.process_runs
  SET
    status = 'completed'::public.process_run_status,
    completed_at = COALESCE(completed_at, now()),
    updated_at = now()
  WHERE id = v_run.id
  RETURNING completed_at INTO v_completed_at;

  INSERT INTO public.process_domain_events (tenant_id, process_run_id, event_type, payload)
  VALUES (
    v_run.tenant_id,
    v_run.id,
    'process_run.completed',
    jsonb_build_object(
      'process_run_id', v_run.id,
      'tenant_id', v_run.tenant_id,
      'process_definition_id', v_run.process_definition_id,
      'batch_ref', v_run.batch_ref,
      'completed_at', v_completed_at
    )
  );

  RETURN new;
END;
$$;
