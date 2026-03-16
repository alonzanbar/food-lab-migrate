
-- Update the signup trigger to auto-assign demo tenant and default worker role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  demo_tenant_id UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
BEGIN
  -- Create profile with demo tenant
  INSERT INTO public.profiles (id, full_name, tenant_id)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), demo_tenant_id);
  
  -- Default role: if email contains 'admin', make admin; otherwise worker
  IF NEW.email LIKE '%admin%' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'worker');
  END IF;
  
  RETURN NEW;
END;
$$;
