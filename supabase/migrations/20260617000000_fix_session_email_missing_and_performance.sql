-- Migration: Fix SESSION_EMAIL_MISSING and make app_session_email safe
BEGIN;

-- 1. Redefine app_session_email() so it safely returns NULL instead of throwing an unhandled exception.
-- When used in RLS policies (e.g. email = public.app_session_email()), returning NULL evaluates to false
-- instead of crashing the entire HTTP PostgREST query with 400 Bad Request / P0001 SESSION_EMAIL_MISSING.
CREATE OR REPLACE FUNCTION public.app_session_email()
RETURNS text
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
  v_email text;
BEGIN
  v_email := lower(nullif(current_setting('app.current_user_email', true), ''));
  RETURN v_email;
END;
$function$;

-- 2. Drop and recreate profile RLS policies
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view verified active profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can insert their own profile" ON public.profiles;

-- Anyone can view active verified profiles (dating and global feed)
CREATE POLICY "Users can view verified active profiles" 
ON public.profiles 
FOR SELECT 
USING (is_verified = true AND is_active = true);

-- Users can view their own profile when session is active OR if authenticated
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (
  public.app_session_email() IS NOT NULL 
  AND email = public.app_session_email()
);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (
  public.app_session_email() IS NOT NULL 
  AND email = public.app_session_email()
);

-- Insert policy
CREATE POLICY "Anyone can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (true);

-- 3. Ensure get_full_profile RPC is robust and returns photos and interests cleanly
CREATE OR REPLACE FUNCTION public.get_full_profile(p_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_profile JSONB;
BEGIN
  SELECT to_jsonb(p) || jsonb_build_object(
      'photos', (
          SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
              'user_email', ph.user_email,
              'photo_url', ph.photo_url,
              'photo_order', ph.photo_order,
              'is_primary', ph.is_primary,
              'is_verified', ph.is_verified,
              'created_at', ph.created_at
            ) ORDER BY ph.photo_order
          ), '[]'::jsonb)
          FROM user_photos ph WHERE ph.user_email = p.email
      ),
      'interests', (
          SELECT COALESCE(jsonb_agg(i.interest), '[]'::jsonb)
          FROM user_interests i WHERE i.user_email = p.email
      )
  ) INTO v_profile
  FROM profiles p
  WHERE p.email = lower(p_email);
  
  RETURN v_profile;
END;
$function$;

-- 4. Fast helper to update last_active_at securely
CREATE OR REPLACE FUNCTION public.touch_last_active(p_email text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  UPDATE public.profiles
  SET last_active_at = now()
  WHERE email = lower(p_email);
$function$;

COMMIT;
