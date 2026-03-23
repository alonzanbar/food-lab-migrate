-- Process engine: step definitions, process graphs, runs, shallow standard layer (CP/CCP annotation)

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

CREATE TYPE public.step_type AS ENUM (
  'plan',
  'execution',
  'measurement',
  'validation'
);

CREATE TYPE public.input_mode AS ENUM (
  'single_form',
  'matrix',
  'hybrid',
  'system'
);

CREATE TYPE public.process_definition_status AS ENUM (
  'draft',
  'published',
  'archived'
);

CREATE TYPE public.process_run_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'cancelled'
);

CREATE TYPE public.process_step_run_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'skipped',
  'failed'
);

CREATE TYPE public.standard_version_status AS ENUM (
  'draft',
  'active',
  'archived'
);

CREATE TYPE public.standard_classification AS ENUM (
  'cp',
  'ccp',
  'none'
);

-- ---------------------------------------------------------------------------
-- step_definitions (catalog; tenant_id NULL = global template)
-- ---------------------------------------------------------------------------

CREATE TABLE public.step_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  step_type public.step_type NOT NULL,
  name_he TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description TEXT,
  input_mode public.input_mode NOT NULL,
  schema JSONB NOT NULL DEFAULT '{}'::jsonb,
  supports_matrix BOOLEAN NOT NULL DEFAULT false,
  default_validation_behavior JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX step_definitions_code_unique_global
  ON public.step_definitions (code)
  WHERE tenant_id IS NULL;

CREATE UNIQUE INDEX step_definitions_code_unique_per_tenant
  ON public.step_definitions (tenant_id, code)
  WHERE tenant_id IS NOT NULL;

CREATE INDEX idx_step_definitions_tenant_id ON public.step_definitions (tenant_id);

ALTER TABLE public.step_definitions ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- process_definitions + phases + steps
-- ---------------------------------------------------------------------------

CREATE TABLE public.process_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name_he TEXT NOT NULL,
  name_en TEXT NOT NULL,
  version TEXT NOT NULL,
  status public.process_definition_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code, version)
);

CREATE INDEX idx_process_definitions_tenant_id ON public.process_definitions (tenant_id);

ALTER TABLE public.process_definitions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.process_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_definition_id UUID NOT NULL REFERENCES public.process_definitions(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name_he TEXT NOT NULL,
  name_en TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (process_definition_id, code),
  UNIQUE (process_definition_id, order_index)
);

CREATE INDEX idx_process_phases_process_definition_id ON public.process_phases (process_definition_id);

ALTER TABLE public.process_phases ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.process_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_definition_id UUID NOT NULL REFERENCES public.process_definitions(id) ON DELETE CASCADE,
  process_phase_id UUID NOT NULL REFERENCES public.process_phases(id) ON DELETE CASCADE,
  step_definition_id UUID NOT NULL REFERENCES public.step_definitions(id) ON DELETE RESTRICT,
  order_index INTEGER NOT NULL,
  parameterization JSONB NOT NULL DEFAULT '{}'::jsonb,
  ui_config JSONB,
  dependencies JSONB,
  required BOOLEAN NOT NULL DEFAULT true,
  repeatable BOOLEAN NOT NULL DEFAULT false,
  skippable BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (process_phase_id, order_index)
);

CREATE INDEX idx_process_steps_process_definition_id ON public.process_steps (process_definition_id);
CREATE INDEX idx_process_steps_step_definition_id ON public.process_steps (step_definition_id);

ALTER TABLE public.process_steps ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- process_runs + process_step_runs
-- ---------------------------------------------------------------------------

CREATE TABLE public.process_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  process_definition_id UUID NOT NULL REFERENCES public.process_definitions(id) ON DELETE RESTRICT,
  status public.process_run_status NOT NULL DEFAULT 'pending',
  batch_ref TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  started_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_process_runs_tenant_id ON public.process_runs (tenant_id);
CREATE INDEX idx_process_runs_process_definition_id ON public.process_runs (process_definition_id);

ALTER TABLE public.process_runs ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.process_step_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  process_run_id UUID NOT NULL REFERENCES public.process_runs(id) ON DELETE CASCADE,
  process_step_id UUID NOT NULL REFERENCES public.process_steps(id) ON DELETE RESTRICT,
  status public.process_step_run_status NOT NULL DEFAULT 'pending',
  captured_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  approvals JSONB,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (process_run_id, process_step_id)
);

CREATE INDEX idx_process_step_runs_tenant_id ON public.process_step_runs (tenant_id);
CREATE INDEX idx_process_step_runs_process_run_id ON public.process_step_runs (process_run_id);

ALTER TABLE public.process_step_runs ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- standards (shallow layer; tenant_id NULL = global template)
-- ---------------------------------------------------------------------------

CREATE TABLE public.standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name_he TEXT NOT NULL,
  name_en TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX standards_code_unique_global
  ON public.standards (code)
  WHERE tenant_id IS NULL;

CREATE UNIQUE INDEX standards_code_unique_per_tenant
  ON public.standards (tenant_id, code)
  WHERE tenant_id IS NOT NULL;

CREATE INDEX idx_standards_tenant_id ON public.standards (tenant_id);

ALTER TABLE public.standards ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.standard_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  standard_id UUID NOT NULL REFERENCES public.standards(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  status public.standard_version_status NOT NULL DEFAULT 'draft',
  effective_from DATE,
  effective_to DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (standard_id, version)
);

CREATE INDEX idx_standard_versions_standard_id ON public.standard_versions (standard_id);

ALTER TABLE public.standard_versions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.standard_process_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  standard_version_id UUID NOT NULL REFERENCES public.standard_versions(id) ON DELETE CASCADE,
  process_step_id UUID NOT NULL REFERENCES public.process_steps(id) ON DELETE CASCADE,
  classification public.standard_classification NOT NULL DEFAULT 'none',
  is_enforced BOOLEAN NOT NULL DEFAULT false,
  control_code TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (standard_version_id, process_step_id)
);

CREATE INDEX idx_standard_process_steps_standard_version_id ON public.standard_process_steps (standard_version_id);
CREATE INDEX idx_standard_process_steps_process_step_id ON public.standard_process_steps (process_step_id);

ALTER TABLE public.standard_process_steps ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Triggers: updated_at
-- ---------------------------------------------------------------------------

CREATE TRIGGER step_definitions_updated_at
  BEFORE UPDATE ON public.step_definitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER process_definitions_updated_at
  BEFORE UPDATE ON public.process_definitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER process_phases_updated_at
  BEFORE UPDATE ON public.process_phases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER process_steps_updated_at
  BEFORE UPDATE ON public.process_steps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER process_runs_updated_at
  BEFORE UPDATE ON public.process_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER process_step_runs_updated_at
  BEFORE UPDATE ON public.process_step_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER standards_updated_at
  BEFORE UPDATE ON public.standards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER standard_versions_updated_at
  BEFORE UPDATE ON public.standard_versions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER standard_process_steps_updated_at
  BEFORE UPDATE ON public.standard_process_steps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Keep process_step_runs.tenant_id in sync with process_runs
CREATE OR REPLACE FUNCTION public.sync_process_step_runs_tenant_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_tenant uuid;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    SELECT tenant_id INTO v_tenant FROM public.process_runs WHERE id = NEW.process_run_id;
    IF v_tenant IS NULL THEN
      RAISE EXCEPTION 'process_run % not found', NEW.process_run_id;
    END IF;
    NEW.tenant_id := v_tenant;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER process_step_runs_sync_tenant
  BEFORE INSERT OR UPDATE OF process_run_id ON public.process_step_runs
  FOR EACH ROW EXECUTE FUNCTION public.sync_process_step_runs_tenant_id();

-- ---------------------------------------------------------------------------
-- RLS: step_definitions
-- ---------------------------------------------------------------------------

CREATE POLICY "step_definitions_select"
  ON public.step_definitions
  FOR SELECT TO authenticated
  USING (
    tenant_id IS NULL
    OR tenant_id = public.get_user_tenant_id()
  );

CREATE POLICY "step_definitions_insert_tenant_admin"
  ON public.step_definitions
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "step_definitions_insert_global_superuser"
  ON public.step_definitions
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IS NULL
    AND public.has_role(auth.uid(), 'superuser')
  );

CREATE POLICY "step_definitions_update_tenant_admin"
  ON public.step_definitions
  FOR UPDATE TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "step_definitions_update_global_superuser"
  ON public.step_definitions
  FOR UPDATE TO authenticated
  USING (
    tenant_id IS NULL
    AND public.has_role(auth.uid(), 'superuser')
  )
  WITH CHECK (
    tenant_id IS NULL
    AND public.has_role(auth.uid(), 'superuser')
  );

CREATE POLICY "step_definitions_delete_tenant_admin"
  ON public.step_definitions
  FOR DELETE TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "step_definitions_delete_global_superuser"
  ON public.step_definitions
  FOR DELETE TO authenticated
  USING (
    tenant_id IS NULL
    AND public.has_role(auth.uid(), 'superuser')
  );

-- ---------------------------------------------------------------------------
-- RLS: process_definitions
-- ---------------------------------------------------------------------------

CREATE POLICY "process_definitions_select"
  ON public.process_definitions
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "process_definitions_mutate_admin"
  ON public.process_definitions
  FOR ALL TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.has_role(auth.uid(), 'admin')
  );

-- ---------------------------------------------------------------------------
-- RLS: process_phases (via parent process_definitions)
-- ---------------------------------------------------------------------------

CREATE POLICY "process_phases_select"
  ON public.process_phases
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.process_definitions pd
      WHERE pd.id = process_phases.process_definition_id
        AND pd.tenant_id = public.get_user_tenant_id()
    )
  );

CREATE POLICY "process_phases_mutate_admin"
  ON public.process_phases
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.process_definitions pd
      WHERE pd.id = process_phases.process_definition_id
        AND pd.tenant_id = public.get_user_tenant_id()
        AND public.has_role(auth.uid(), 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.process_definitions pd
      WHERE pd.id = process_phases.process_definition_id
        AND pd.tenant_id = public.get_user_tenant_id()
        AND public.has_role(auth.uid(), 'admin')
    )
  );

-- ---------------------------------------------------------------------------
-- RLS: process_steps
-- ---------------------------------------------------------------------------

CREATE POLICY "process_steps_select"
  ON public.process_steps
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.process_definitions pd
      WHERE pd.id = process_steps.process_definition_id
        AND pd.tenant_id = public.get_user_tenant_id()
    )
  );

CREATE POLICY "process_steps_mutate_admin"
  ON public.process_steps
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.process_definitions pd
      WHERE pd.id = process_steps.process_definition_id
        AND pd.tenant_id = public.get_user_tenant_id()
        AND public.has_role(auth.uid(), 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.process_definitions pd
      WHERE pd.id = process_steps.process_definition_id
        AND pd.tenant_id = public.get_user_tenant_id()
        AND public.has_role(auth.uid(), 'admin')
    )
  );

-- ---------------------------------------------------------------------------
-- RLS: process_runs
-- ---------------------------------------------------------------------------

CREATE POLICY "process_runs_select"
  ON public.process_runs
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "process_runs_insert"
  ON public.process_runs
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "process_runs_update"
  ON public.process_runs
  FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (tenant_id = public.get_user_tenant_id());

-- ---------------------------------------------------------------------------
-- RLS: process_step_runs
-- ---------------------------------------------------------------------------

CREATE POLICY "process_step_runs_select"
  ON public.process_step_runs
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "process_step_runs_insert"
  ON public.process_step_runs
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "process_step_runs_update"
  ON public.process_step_runs
  FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (tenant_id = public.get_user_tenant_id());

-- ---------------------------------------------------------------------------
-- RLS: standards
-- ---------------------------------------------------------------------------

CREATE POLICY "standards_select"
  ON public.standards
  FOR SELECT TO authenticated
  USING (
    tenant_id IS NULL
    OR tenant_id = public.get_user_tenant_id()
  );

CREATE POLICY "standards_insert_tenant_admin"
  ON public.standards
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "standards_insert_global_superuser"
  ON public.standards
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IS NULL
    AND public.has_role(auth.uid(), 'superuser')
  );

CREATE POLICY "standards_update_tenant_admin"
  ON public.standards
  FOR UPDATE TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "standards_update_global_superuser"
  ON public.standards
  FOR UPDATE TO authenticated
  USING (
    tenant_id IS NULL
    AND public.has_role(auth.uid(), 'superuser')
  )
  WITH CHECK (
    tenant_id IS NULL
    AND public.has_role(auth.uid(), 'superuser')
  );

CREATE POLICY "standards_delete_tenant_admin"
  ON public.standards
  FOR DELETE TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "standards_delete_global_superuser"
  ON public.standards
  FOR DELETE TO authenticated
  USING (
    tenant_id IS NULL
    AND public.has_role(auth.uid(), 'superuser')
  );

-- ---------------------------------------------------------------------------
-- RLS: standard_versions (via standards)
-- ---------------------------------------------------------------------------

CREATE POLICY "standard_versions_select"
  ON public.standard_versions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.standards s
      WHERE s.id = standard_versions.standard_id
        AND (
          s.tenant_id IS NULL
          OR s.tenant_id = public.get_user_tenant_id()
        )
    )
  );

CREATE POLICY "standard_versions_mutate_tenant_admin"
  ON public.standard_versions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.standards s
      WHERE s.id = standard_versions.standard_id
        AND s.tenant_id = public.get_user_tenant_id()
        AND public.has_role(auth.uid(), 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.standards s
      WHERE s.id = standard_versions.standard_id
        AND s.tenant_id = public.get_user_tenant_id()
        AND public.has_role(auth.uid(), 'admin')
    )
  );

CREATE POLICY "standard_versions_mutate_global_superuser"
  ON public.standard_versions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.standards s
      WHERE s.id = standard_versions.standard_id
        AND s.tenant_id IS NULL
        AND public.has_role(auth.uid(), 'superuser')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.standards s
      WHERE s.id = standard_versions.standard_id
        AND s.tenant_id IS NULL
        AND public.has_role(auth.uid(), 'superuser')
    )
  );

-- ---------------------------------------------------------------------------
-- RLS: standard_process_steps (tenant via standard OR process_step's process_definition)
-- ---------------------------------------------------------------------------

CREATE POLICY "standard_process_steps_select"
  ON public.standard_process_steps
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.standard_versions sv
      JOIN public.standards s ON s.id = sv.standard_id
      WHERE sv.id = standard_process_steps.standard_version_id
        AND (
          s.tenant_id IS NULL
          OR s.tenant_id = public.get_user_tenant_id()
        )
    )
  );

CREATE POLICY "standard_process_steps_mutate_tenant_admin"
  ON public.standard_process_steps
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.standard_versions sv
      JOIN public.standards s ON s.id = sv.standard_id
      JOIN public.process_steps ps ON ps.id = standard_process_steps.process_step_id
      JOIN public.process_definitions pd ON pd.id = ps.process_definition_id
      WHERE sv.id = standard_process_steps.standard_version_id
        AND s.tenant_id = pd.tenant_id
        AND s.tenant_id = public.get_user_tenant_id()
        AND pd.tenant_id = public.get_user_tenant_id()
        AND public.has_role(auth.uid(), 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.standard_versions sv
      JOIN public.standards s ON s.id = sv.standard_id
      JOIN public.process_steps ps ON ps.id = standard_process_steps.process_step_id
      JOIN public.process_definitions pd ON pd.id = ps.process_definition_id
      WHERE sv.id = standard_process_steps.standard_version_id
        AND s.tenant_id = pd.tenant_id
        AND s.tenant_id = public.get_user_tenant_id()
        AND pd.tenant_id = public.get_user_tenant_id()
        AND public.has_role(auth.uid(), 'admin')
    )
  );

CREATE POLICY "standard_process_steps_mutate_global_superuser"
  ON public.standard_process_steps
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.standard_versions sv
      JOIN public.standards s ON s.id = sv.standard_id
      JOIN public.process_steps ps ON ps.id = standard_process_steps.process_step_id
      JOIN public.process_definitions pd ON pd.id = ps.process_definition_id
      WHERE sv.id = standard_process_steps.standard_version_id
        AND s.tenant_id IS NULL
        AND public.has_role(auth.uid(), 'superuser')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.standard_versions sv
      JOIN public.standards s ON s.id = sv.standard_id
      JOIN public.process_steps ps ON ps.id = standard_process_steps.process_step_id
      JOIN public.process_definitions pd ON pd.id = ps.process_definition_id
      WHERE sv.id = standard_process_steps.standard_version_id
        AND s.tenant_id IS NULL
        AND public.has_role(auth.uid(), 'superuser')
    )
  );

COMMENT ON TABLE public.step_definitions IS 'Reusable step catalog; schema + field types. No CP/CCP — use standard_process_steps.';
COMMENT ON TABLE public.process_steps IS 'Process-specific step instance; parameterization holds validation/thresholds/UI.';
COMMENT ON TABLE public.standard_process_steps IS 'Annotation only: CP/CCP classification and enforcement for a standard version.';
