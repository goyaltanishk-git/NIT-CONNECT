-- ==========================================
-- RECREATE communities_created_by_fkey WITH ON DELETE CASCADE
-- ==========================================

-- 1. Drop existing constraint if it exists
ALTER TABLE public.communities 
DROP CONSTRAINT IF EXISTS communities_created_by_fkey;

-- 2. Add constraint back with ON DELETE CASCADE
ALTER TABLE public.communities 
ADD CONSTRAINT communities_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES public.profiles(email) 
ON DELETE CASCADE;
