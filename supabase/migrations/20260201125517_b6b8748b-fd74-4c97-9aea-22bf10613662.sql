-- Drop the existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create an improved function that only creates profile after email confirmation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_display_name TEXT;
BEGIN
  -- Only create profile if email is confirmed
  -- For new signups, email_confirmed_at will be NULL until verified
  -- This trigger fires on INSERT and UPDATE
  
  -- Check if this is a newly confirmed email
  IF TG_OP = 'UPDATE' THEN
    -- Only proceed if email was just confirmed (was NULL, now has value)
    IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
      -- Check if profile already exists (shouldn't, but just in case)
      IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
        v_display_name := TRIM(COALESCE(NEW.raw_user_meta_data ->> 'display_name', ''));
        v_display_name := SUBSTRING(REGEXP_REPLACE(v_display_name, '[\x00-\x1F\x7F]', '', 'g'), 1, 100);
        
        INSERT INTO public.profiles (id, email, display_name)
        VALUES (NEW.id, NEW.email, NULLIF(v_display_name, ''));
      END IF;
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    -- For INSERT, only create profile if email is already confirmed (e.g., OAuth, auto-confirm enabled)
    IF NEW.email_confirmed_at IS NOT NULL THEN
      v_display_name := TRIM(COALESCE(NEW.raw_user_meta_data ->> 'display_name', ''));
      v_display_name := SUBSTRING(REGEXP_REPLACE(v_display_name, '[\x00-\x1F\x7F]', '', 'g'), 1, 100);
      
      INSERT INTO public.profiles (id, email, display_name)
      VALUES (NEW.id, NEW.email, NULLIF(v_display_name, ''));
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for INSERT (handles OAuth and auto-confirm cases)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create trigger for UPDATE (handles email confirmation)
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_user();

-- Clean up: Remove profiles for users who haven't confirmed their email yet
DELETE FROM public.profiles 
WHERE id IN (
  SELECT p.id FROM public.profiles p
  LEFT JOIN auth.users u ON p.id = u.id
  WHERE u.email_confirmed_at IS NULL
);