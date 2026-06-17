-- Migration: Fix profiles RLS policies to use app_session_email()
BEGIN;

-- 1. Drop existing policies on profiles
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view verified active profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can insert their own profile" ON public.profiles;

-- 2. Create the correct policies using app_session_email()
-- SELECT: Users can view verified active profiles OR their own profile
CREATE POLICY "Users can view verified active profiles" 
ON public.profiles 
FOR SELECT 
USING (is_verified = true AND is_active = true);

CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (email = public.app_session_email());

-- UPDATE: Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (email = public.app_session_email());

-- INSERT: Anyone can insert their own profile
CREATE POLICY "Anyone can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (true);

COMMIT;
