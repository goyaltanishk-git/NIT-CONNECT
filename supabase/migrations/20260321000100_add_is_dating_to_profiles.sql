-- Add opt-in flag for dating visibility.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_dating boolean NOT NULL DEFAULT false;

-- Helpful index for discovery queries that only show active dating users.
CREATE INDEX IF NOT EXISTS idx_profiles_dating_visibility
ON public.profiles (is_dating, is_active, is_verified, college);
