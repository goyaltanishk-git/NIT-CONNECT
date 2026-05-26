-- BUG-055: Add unique index on (email, date) so every swipe query is an index scan, not a full table scan.
-- Also required by the ON CONFLICT clause in increment_daily_like below.
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_limits_email_date
  ON public.daily_limits (email, date);

-- BUG-192: Atomic check-and-increment for daily likes.
-- Uses SELECT FOR UPDATE inside a transaction so parallel swipes cannot both pass the limit check.
-- Returns TRUE if the like was allowed, FALSE if the daily limit is already reached.
CREATE OR REPLACE FUNCTION increment_daily_like(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_likes_used INTEGER;
  v_limit      INTEGER;
  v_is_premium BOOLEAN;
BEGIN
  SELECT is_premium INTO v_is_premium
  FROM   profiles
  WHERE  email = lower(p_email)
  LIMIT  1;

  v_limit := CASE WHEN v_is_premium IS TRUE THEN 999 ELSE 2 END;

  -- Ensure a row exists for today (INSERT or no-op if already present)
  INSERT INTO daily_limits (email, date, likes_used)
  VALUES (lower(p_email), CURRENT_DATE, 0)
  ON CONFLICT (email, date) DO NOTHING;

  -- Lock the row for the remainder of this transaction
  SELECT likes_used INTO v_likes_used
  FROM   daily_limits
  WHERE  email = lower(p_email)
    AND  date  = CURRENT_DATE
  FOR UPDATE;

  IF v_likes_used >= v_limit THEN
    RETURN FALSE;
  END IF;

  UPDATE daily_limits
  SET    likes_used = likes_used + 1
  WHERE  email = lower(p_email)
    AND  date  = CURRENT_DATE;

  RETURN TRUE;
END;
$$;

-- BUG-090: Enforce admin check on job post submissions at the DB level.
-- Any RPC or direct insert on pending_jobs is blocked unless the caller's email
-- is listed in the admins table (or has the service_role).
ALTER TABLE public.pending_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "only admins can insert jobs"
  ON public.pending_jobs FOR INSERT
  WITH CHECK (
    current_setting('app.user_email', true) IN (
      SELECT email FROM public.admins
    )
    OR current_setting('role', true) = 'service_role'
  );
