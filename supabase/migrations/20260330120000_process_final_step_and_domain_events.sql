-- Final step per process definition, run completion on final step submit, domain event outbox.
-- When a process_step_run transitions to completed on a process_steps row with is_final_step,
-- and all required step runs are terminal (completed, or skipped if skippable), set process_runs
-- to completed and insert process_domain_events (same transaction).

ALTER TABLE public.process_steps
  ADD COLUMN IF NOT EXISTS is_final_step boolean NOT NULL DEFAULT false;

-- Last step per definition: max phase order_index, then max step order_index within that phase.
WITH ordered AS (
  SELECT ps.id,
         ROW_NUMBER() OVER (
           PARTITION BY ps.process_definition_id
           ORDER BY ph.order_index DESC, ps.order_index DESC
         ) AS rn
  FROM public.process_steps ps
  JOIN public.process_phases ph ON ph.id = ps.process_phase_id
)
UPDATE public.process_steps ps
SET is_final_step = true
FROM ordered o
WHERE ps.id = o.id AND o.rn = 1;

CREATE UNIQUE INDEX process_steps_one_final_per_definition
  ON public.process_steps (process_definition_id)
  WHERE is_final_step;

CREATE TABLE public.process_domain_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  process_run_id uuid NOT NULL REFERENCES public.process_runs(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('process_run.completed')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_process_domain_events_unprocessed
  ON public.process_domain_events (created_at)
  WHERE processed_at IS NULL;

CREATE INDEX idx_process_domain_events_process_run_id
  ON public.process_domain_events (process_run_id);

COMMENT ON TABLE public.process_domain_events IS
  'Outbox for domain events. Written by finalize trigger; consumers use service role or Database Webhooks.';

ALTER TABLE public.process_domain_events ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.on_process_step_run_completed_finalize_run()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_final boolean;
  v_run record;
  v_all_required_done boolean;
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

  SELECT NOT EXISTS (
    SELECT 1
    FROM public.process_steps ps
    INNER JOIN public.process_step_runs sr
      ON sr.process_step_id = ps.id AND sr.process_run_id = new.process_run_id
    WHERE ps.process_definition_id = v_run.process_definition_id
      AND ps.required = true
      AND NOT (
        sr.status = 'completed'::public.process_step_run_status
        OR (
          ps.skippable = true
          AND sr.status = 'skipped'::public.process_step_run_status
        )
      )
  )
  INTO v_all_required_done;

  IF NOT COALESCE(v_all_required_done, false) THEN
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

CREATE TRIGGER process_step_runs_finalize_run_on_completed
  AFTER UPDATE OF status ON public.process_step_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.on_process_step_run_completed_finalize_run();
