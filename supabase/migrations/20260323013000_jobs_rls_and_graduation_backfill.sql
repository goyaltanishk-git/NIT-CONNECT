BEGIN;

-- 1) Ensure graduation_batch exists and is constrained.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS graduation_batch integer;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_graduation_batch_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_graduation_batch_check
  CHECK (graduation_batch IS NULL OR graduation_batch BETWEEN 2020 AND 2100);

CREATE INDEX IF NOT EXISTS idx_profiles_graduation_batch
  ON public.profiles (graduation_batch);

-- 2) Backfill graduation_batch from current year_of_study values in IST context.
-- Mapping assumes B.Tech style progression:
-- 1st -> current IST year + 3
-- 2nd -> current IST year + 2
-- 3rd -> current IST year + 1
-- 4th -> current IST year
-- If year_of_study already looks like a 4-digit year, use it directly.
WITH ist_year AS (
  SELECT EXTRACT(YEAR FROM (now() AT TIME ZONE 'Asia/Kolkata'))::int AS current_year
), parsed AS (
  SELECT
    p.email,
    p.year_of_study,
    CASE
      WHEN p.year_of_study ~ '^\\s*20\\d{2}\\s*$' THEN trim(p.year_of_study)::int
      WHEN p.year_of_study ~* '^\\s*1(st)?\\s*year\\s*$' OR p.year_of_study ~ '^\\s*1\\s*$' THEN (SELECT current_year + 3 FROM ist_year)
      WHEN p.year_of_study ~* '^\\s*2(nd)?\\s*year\\s*$' OR p.year_of_study ~ '^\\s*2\\s*$' THEN (SELECT current_year + 2 FROM ist_year)
      WHEN p.year_of_study ~* '^\\s*3(rd)?\\s*year\\s*$' OR p.year_of_study ~ '^\\s*3\\s*$' THEN (SELECT current_year + 1 FROM ist_year)
      WHEN p.year_of_study ~* '^\\s*4(th)?\\s*year\\s*$' OR p.year_of_study ~ '^\\s*4\\s*$' THEN (SELECT current_year FROM ist_year)
      ELSE NULL
    END AS inferred_batch
  FROM public.profiles p
)
UPDATE public.profiles p
SET graduation_batch = parsed.inferred_batch,
    updated_at = now()
FROM parsed
WHERE p.email = parsed.email
  AND parsed.inferred_batch IS NOT NULL
  AND (p.graduation_batch IS NULL OR p.graduation_batch <> parsed.inferred_batch);

-- 3) Explicit RLS policies for new job tables.
-- The project is RPC-only for jobs; direct access remains denied.
ALTER TABLE public.job_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_target_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_daily_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_swipes ENABLE ROW LEVEL SECURITY;

-- Drop stale policies if they exist.
DROP POLICY IF EXISTS "job_admins_no_direct_access" ON public.job_admins;
DROP POLICY IF EXISTS "jobs_no_direct_access" ON public.jobs;
DROP POLICY IF EXISTS "job_target_groups_no_direct_access" ON public.job_target_groups;
DROP POLICY IF EXISTS "job_daily_slots_no_direct_access" ON public.job_daily_slots;
DROP POLICY IF EXISTS "job_swipes_no_direct_access" ON public.job_swipes;

-- Deny all direct access explicitly.
CREATE POLICY "job_admins_no_direct_access"
ON public.job_admins
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "jobs_no_direct_access"
ON public.jobs
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "job_target_groups_no_direct_access"
ON public.job_target_groups
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "job_daily_slots_no_direct_access"
ON public.job_daily_slots
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "job_swipes_no_direct_access"
ON public.job_swipes
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- Reinforce RPC-only posture via grants.
REVOKE ALL ON TABLE public.job_admins FROM anon, authenticated;
REVOKE ALL ON TABLE public.jobs FROM anon, authenticated;
REVOKE ALL ON TABLE public.job_target_groups FROM anon, authenticated;
REVOKE ALL ON TABLE public.job_daily_slots FROM anon, authenticated;
REVOKE ALL ON TABLE public.job_swipes FROM anon, authenticated;

COMMIT;
