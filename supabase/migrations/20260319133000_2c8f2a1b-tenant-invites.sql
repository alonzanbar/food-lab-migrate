-- Tenant invites for onboarding (Edge Function driven)

CREATE TABLE IF NOT EXISTS public.tenant_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.app_role NOT NULL DEFAULT 'worker',
  token TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_invites_tenant_id_created_at
ON public.tenant_invites (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tenant_invites_token
ON public.tenant_invites (token);

CREATE INDEX IF NOT EXISTS idx_tenant_invites_email
ON public.tenant_invites (email);

ALTER TABLE public.tenant_invites ENABLE ROW LEVEL SECURITY;

-- Admins can read invites for their tenant
CREATE POLICY "Admins can view tenant invites"
ON public.tenant_invites
FOR SELECT TO authenticated
USING (
  tenant_id = public.get_user_tenant_id()
  AND public.has_role(auth.uid(), 'admin')
);

-- Admins can create invites for their tenant
CREATE POLICY "Admins can create tenant invites"
ON public.tenant_invites
FOR INSERT TO authenticated
WITH CHECK (
  tenant_id = public.get_user_tenant_id()
  AND public.has_role(auth.uid(), 'admin')
  AND created_by = auth.uid()
);

-- Updates (mark used) are expected to be done via service role Edge Function.
