-- Superuser tenant management: status, created_by, RLS

-- 1) Add columns to tenants
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2) Helper for RLS
CREATE OR REPLACE FUNCTION public.is_superuser()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'superuser'
  )
$$;

-- 3) Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_tenants_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tenants_updated_at ON public.tenants;
CREATE TRIGGER tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_tenants_updated_at();

-- 4) RLS: superusers can view and update all tenants
CREATE POLICY "Superusers can view all tenants"
ON public.tenants
FOR SELECT TO authenticated
USING (public.is_superuser());

CREATE POLICY "Superusers can update tenants"
ON public.tenants
FOR UPDATE TO authenticated
USING (public.is_superuser())
WITH CHECK (public.is_superuser());

-- 5) Superusers can view profiles for any tenant (for member list)
CREATE POLICY "Superusers can view all profiles"
ON public.profiles
FOR SELECT TO authenticated
USING (public.is_superuser());
