-- Migration: Automatically keep is_verified in sync with verification_status on public.profiles
BEGIN;

-- 1. Create or replace the trigger function
CREATE OR REPLACE FUNCTION public.sync_profile_is_verified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.verification_status = 'verified' THEN
    NEW.is_verified := true;
  ELSE
    NEW.is_verified := false;
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Create the trigger
DROP TRIGGER IF EXISTS trg_sync_profile_is_verified ON public.profiles;
CREATE TRIGGER trg_sync_profile_is_verified
BEFORE INSERT OR UPDATE OF verification_status ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_is_verified();

-- 3. Update existing profiles that are out of sync
UPDATE public.profiles
SET is_verified = true, updated_at = now()
WHERE verification_status = 'verified' AND is_verified = false;

UPDATE public.profiles
SET is_verified = false, updated_at = now()
WHERE (verification_status IS NULL OR verification_status <> 'verified') AND is_verified = true;

COMMIT;
