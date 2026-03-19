-- Multi-tenant hardening + system-level templates

-- 1) Forms support system-level templates
ALTER TABLE public.forms
ADD COLUMN IF NOT EXISTS is_template BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_forms_tenant_id_created_at
ON public.forms (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_forms_is_template
ON public.forms (is_template);

-- Support composite FK checks from tenant-scoped child tables.
CREATE UNIQUE INDEX IF NOT EXISTS idx_forms_id_tenant_unique
ON public.forms (id, tenant_id);

-- 2) Enforce cross-table tenant consistency
ALTER TABLE public.form_submissions
DROP CONSTRAINT IF EXISTS form_submissions_form_id_tenant_fk;

ALTER TABLE public.form_submissions
ADD CONSTRAINT form_submissions_form_id_tenant_fk
FOREIGN KEY (form_id, tenant_id)
REFERENCES public.forms(id, tenant_id)
ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_form_submissions_tenant_id_submitted_at
ON public.form_submissions (tenant_id, submitted_at DESC);

ALTER TABLE public.reports
DROP CONSTRAINT IF EXISTS reports_form_id_tenant_fk;

ALTER TABLE public.reports
ADD CONSTRAINT reports_form_id_tenant_fk
FOREIGN KEY (form_id, tenant_id)
REFERENCES public.forms(id, tenant_id)
ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_reports_tenant_id_created_at
ON public.reports (tenant_id, created_at DESC);

-- 3) Normalize signup onboarding behavior:
-- no hardcoded tenant assignment, no email-pattern role escalation.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, tenant_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NULL
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'worker')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 4) RLS: tenant forms + globally readable templates
DROP POLICY IF EXISTS "Users can view tenant forms" ON public.forms;
DROP POLICY IF EXISTS "Admins can insert forms" ON public.forms;
DROP POLICY IF EXISTS "Admins can update forms" ON public.forms;
DROP POLICY IF EXISTS "Admins can delete forms" ON public.forms;

CREATE POLICY "Users can view tenant forms and templates"
ON public.forms
FOR SELECT TO authenticated
USING (
  tenant_id = public.get_user_tenant_id()
  OR is_template = true
);

-- Templates are system-level and read-only in app flows.
CREATE POLICY "Admins can insert tenant forms"
ON public.forms
FOR INSERT TO authenticated
WITH CHECK (
  tenant_id = public.get_user_tenant_id()
  AND public.has_role(auth.uid(), 'admin')
  AND is_template = false
);

CREATE POLICY "Admins can update tenant forms"
ON public.forms
FOR UPDATE TO authenticated
USING (
  tenant_id = public.get_user_tenant_id()
  AND public.has_role(auth.uid(), 'admin')
  AND is_template = false
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id()
  AND public.has_role(auth.uid(), 'admin')
  AND is_template = false
);

CREATE POLICY "Admins can delete tenant forms"
ON public.forms
FOR DELETE TO authenticated
USING (
  tenant_id = public.get_user_tenant_id()
  AND public.has_role(auth.uid(), 'admin')
  AND is_template = false
);

-- 5) Tighten storage policies by tenant path
DROP POLICY IF EXISTS "Authenticated users can upload form files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view form files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload submission images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view submission images" ON storage.objects;

CREATE POLICY "Authenticated users can upload form files"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'form-uploads'
  AND (storage.foldername(name))[1] = public.get_user_tenant_id()::text
);

CREATE POLICY "Authenticated users can view form files"
ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'form-uploads'
  AND (storage.foldername(name))[1] = public.get_user_tenant_id()::text
);

CREATE POLICY "Authenticated users can upload submission images"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'submission-images'
  AND (storage.foldername(name))[1] = public.get_user_tenant_id()::text
);

CREATE POLICY "Anyone can view submission images"
ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'submission-images'
  AND (storage.foldername(name))[1] = public.get_user_tenant_id()::text
);
