-- ==========================================
-- SECURE ACCOUNT DELETION RPC (SECURITY DEFINER)
-- Bypass RLS to clean up and deactivate profiles
-- ==========================================

CREATE OR REPLACE FUNCTION public.delete_user_account_db(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Delete photo records from DB
  DELETE FROM public.user_photos WHERE user_email = p_email;
  
  -- 2. Delete verification record from DB
  DELETE FROM public.student_verifications WHERE email = p_email;
  
  -- 3. Delete interests from DB
  DELETE FROM public.user_interests WHERE user_email = p_email;
  
  -- 4. Update profiles table to deactivate and reset values
  UPDATE public.profiles
  SET
    is_active = false,
    bio = null,
    height = null,
    hometown = null,
    phone_number = null,
    instagram_handle = null,
    updated_at = now()
  WHERE email = p_email;

  RETURN true;
END;
$$;
