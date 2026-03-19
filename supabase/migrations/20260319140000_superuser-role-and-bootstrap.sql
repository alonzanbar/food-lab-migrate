-- Add superuser role and bootstrap helper (Option A)

-- 1) Add superuser to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'superuser';

-- 2) Bootstrap function: call once to grant superuser to a user by email.
-- Usage: SELECT public.bootstrap_superuser('admin@yourcompany.com');
CREATE OR REPLACE FUNCTION public.bootstrap_superuser(p_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_result jsonb;
BEGIN
  IF p_email IS NULL OR trim(p_email) = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'email is required');
  END IF;

  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = lower(trim(p_email))
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'user not found for email: ' || p_email);
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'superuser'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'user_id', v_user_id);
END;
$$;

COMMENT ON FUNCTION public.bootstrap_superuser(text) IS
  'One-time bootstrap: grant superuser role to user by email. Run: SELECT bootstrap_superuser(''admin@example.com'');';
