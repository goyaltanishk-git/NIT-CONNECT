-- ─────────────────────────────────────────────
-- 1. Add is_premium flag to profiles
-- ─────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT false;

-- ─────────────────────────────────────────────
-- 2. Subscriptions table
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email             TEXT        NOT NULL,
  plan                   TEXT        NOT NULL DEFAULT 'free',   -- 'free' | 'premium'
  razorpay_order_id      TEXT,
  razorpay_payment_id    TEXT,
  razorpay_signature     TEXT,
  status                 TEXT        NOT NULL DEFAULT 'pending', -- 'pending' | 'active' | 'expired'
  amount_paise           INTEGER,                               -- amount in paise (e.g. 19900 = ₹199)
  starts_at              TIMESTAMPTZ,
  expires_at             TIMESTAMPTZ,                           -- NULL = lifetime
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscriptions_user_email_idx ON subscriptions(user_email);
CREATE INDEX IF NOT EXISTS subscriptions_order_id_idx   ON subscriptions(razorpay_order_id);

-- ─────────────────────────────────────────────
-- 3. RLS on subscriptions
-- ─────────────────────────────────────────────
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscription rows
CREATE POLICY "user can read own subscriptions"
  ON subscriptions FOR SELECT
  USING (user_email = current_setting('app.user_email', true));

-- Only service-role (edge functions) can insert/update
CREATE POLICY "service role can manage subscriptions"
  ON subscriptions FOR ALL
  USING (current_setting('role', true) = 'service_role');

-- ─────────────────────────────────────────────
-- 4. RPC: get_my_subscription(p_email text)
--    Returns the active subscription row for a user.
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_my_subscription(p_email TEXT)
RETURNS TABLE (
  plan        TEXT,
  status      TEXT,
  expires_at  TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT s.plan, s.status, s.expires_at
  FROM   subscriptions s
  WHERE  s.user_email = lower(p_email)
    AND  s.status     = 'active'
  ORDER  BY s.created_at DESC
  LIMIT  1;
END;
$$;

-- ─────────────────────────────────────────────
-- 5. Update get_daily_limits RPC to respect is_premium
--    Free:    2 dating likes / day
--    Premium: 999 (effectively unlimited)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_daily_limits(p_email TEXT)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_likes_used  INTEGER;
  v_is_premium  BOOLEAN;
BEGIN
  -- Check premium status
  SELECT is_premium INTO v_is_premium
  FROM   profiles
  WHERE  email = lower(p_email)
  LIMIT  1;

  IF v_is_premium IS TRUE THEN
    -- Premium: return a sentinel meaning "no real limit enforced"
    -- We return current usage so UI can still display it
    SELECT COALESCE(likes_used, 0) INTO v_likes_used
    FROM   daily_limits
    WHERE  email = lower(p_email)
      AND  date  = CURRENT_DATE;
    RETURN COALESCE(v_likes_used, 0);
  END IF;

  -- Free tier
  SELECT COALESCE(likes_used, 0) INTO v_likes_used
  FROM   daily_limits
  WHERE  email = lower(p_email)
    AND  date  = CURRENT_DATE;

  RETURN COALESCE(v_likes_used, 0);
END;
$$;

-- ─────────────────────────────────────────────
-- 6. RPC: get_daily_like_limit(p_email text)
--    Returns the cap for the user (2 or 999)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_daily_like_limit(p_email TEXT)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_premium BOOLEAN;
BEGIN
  SELECT is_premium INTO v_is_premium
  FROM   profiles
  WHERE  email = lower(p_email)
  LIMIT  1;

  IF v_is_premium IS TRUE THEN
    RETURN 999;
  END IF;
  RETURN 2;
END;
$$;

-- ─────────────────────────────────────────────
-- 7. RPC: get_job_daily_limit(p_email text)
--    Free: 2 jobs/day, Premium: 5 jobs/day
--    (job slot system uses job_daily_slots table)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_job_daily_limit(p_email TEXT)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_premium BOOLEAN;
BEGIN
  SELECT is_premium INTO v_is_premium
  FROM   profiles
  WHERE  email = lower(p_email)
  LIMIT  1;

  IF v_is_premium IS TRUE THEN
    RETURN 5;
  END IF;
  RETURN 2;
END;
$$;

-- ─────────────────────────────────────────────
-- 8. RPC: get_community_join_limit(p_email text)
--    Free: 5 total joins, Premium: 15 total joins
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_community_join_limit(p_email TEXT)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_premium BOOLEAN;
BEGIN
  SELECT is_premium INTO v_is_premium
  FROM   profiles
  WHERE  email = lower(p_email)
  LIMIT  1;

  IF v_is_premium IS TRUE THEN
    RETURN 15;
  END IF;
  RETURN 5;
END;
$$;

-- ─────────────────────────────────────────────
-- 9. RPC: get_community_join_count(p_email text)
--    Returns total approved community memberships
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_community_join_count(p_email TEXT)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM   community_members
  WHERE  user_email = lower(p_email)
    AND  status     = 'approved';

  RETURN COALESCE(v_count, 0);
END;
$$;
