-- BUG-047: Enforce admin check at DB level on the jobs table.
-- Even if the frontend check is bypassed, non-admins cannot insert jobs.
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "only active job_admins can insert jobs"
  ON public.jobs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.job_admins
      WHERE email     = lower(current_setting('app.user_email', true))
        AND is_active = true
    )
    OR current_setting('role', true) = 'service_role'
  );

-- Drop first because PostgreSQL won't allow changing a function's return type in-place.
DROP FUNCTION IF EXISTS jobs_admin_can_add CASCADE;

CREATE OR REPLACE FUNCTION jobs_admin_can_add()
RETURNS TABLE (can_add BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT EXISTS (
    SELECT 1 FROM public.job_admins
    WHERE email     = lower(current_setting('app.user_email', true))
      AND is_active = true
  ) AS can_add;
END;
$$;
