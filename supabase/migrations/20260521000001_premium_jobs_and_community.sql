-- ═══════════════════════════════════════════════════════════════════
-- Premium-aware jobs feed + community join limit
-- Free:    2 job slots/day,  5  community joins total
-- Premium: 5 job slots/day, 15 community joins total
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────
-- 1. jobs_get_daily_feed — respects is_premium
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.jobs_get_daily_feed(p_tz text DEFAULT 'Asia/Kolkata')
RETURNS TABLE (
  slot_no smallint,
  job_id uuid,
  title text,
  company_name text,
  location_text text,
  employment_type text,
  work_mode text,
  stipend_salary_label text,
  stipend_min numeric,
  stipend_max numeric,
  currency_code text,
  is_pre_placement_offer boolean,
  tag_pills text[],
  application_url text,
  expires_at timestamptz,
  swiped_at timestamptz,
  swipe_action text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email      text;
  v_today      date;
  v_branch     text;
  v_batch      int;
  v_existing   int;
  v_remaining  int;
  v_is_premium boolean;
  v_max_slots  int;
BEGIN
  v_email := public.app_session_email();
  v_today := public.jobs_today_ist(p_tz);

  PERFORM pg_advisory_xact_lock(hashtextextended(v_email || ':' || v_today::text, 0));

  SELECT p.branch, p.graduation_batch, COALESCE(p.is_premium, false)
  INTO   v_branch, v_batch, v_is_premium
  FROM   public.profiles p
  WHERE  lower(p.email) = v_email
  LIMIT  1;

  IF v_branch IS NULL OR v_batch IS NULL THEN RETURN; END IF;

  v_max_slots := CASE WHEN v_is_premium THEN 5 ELSE 2 END;

  -- Remove stale unswiped slots for expired/inactive jobs
  DELETE FROM public.job_daily_slots s
  USING public.jobs j
  WHERE s.user_email = v_email
    AND s.slot_date  = v_today
    AND s.swiped_at  IS NULL
    AND s.job_id     = j.id
    AND (j.status <> 'active' OR (j.expires_at IS NOT NULL AND j.expires_at <= now()));

  SELECT COUNT(*)::int INTO v_existing
  FROM   public.job_daily_slots s
  WHERE  s.user_email = v_email AND s.slot_date = v_today;

  v_remaining := GREATEST(0, v_max_slots - v_existing);

  IF v_remaining > 0 THEN
    WITH free_slots AS (
      SELECT gs AS slot_no
      FROM   generate_series(1, v_max_slots) gs
      WHERE  NOT EXISTS (
        SELECT 1 FROM public.job_daily_slots s
        WHERE  s.user_email = v_email
          AND  s.slot_date  = v_today
          AND  s.slot_no    = gs
      )
      ORDER BY gs
      LIMIT v_remaining
    ), candidates AS (
      SELECT j.id
      FROM   public.jobs j
      WHERE  j.status = 'active'
        AND  (j.expires_at IS NULL OR j.expires_at > now())
        AND  EXISTS (
          SELECT 1 FROM public.job_target_groups tg
          WHERE  tg.job_id = j.id
            AND  lower(tg.target_branch) = lower(v_branch)
            AND  tg.target_graduation_batch = v_batch
        )
        AND  NOT EXISTS (
          SELECT 1 FROM public.job_swipes js
          WHERE  js.user_email = v_email AND js.job_id = j.id
        )
        AND  NOT EXISTS (
          SELECT 1 FROM public.job_daily_slots ds
          WHERE  ds.user_email = v_email
            AND  ds.slot_date  = v_today
            AND  ds.job_id     = j.id
        )
      ORDER BY md5(j.id::text || v_email || v_today::text)
      LIMIT v_remaining
    ), numbered AS (
      SELECT c.id AS job_id, f.slot_no
      FROM   candidates c
      JOIN   free_slots  f ON true
      ORDER  BY f.slot_no
      LIMIT  v_remaining
    )
    INSERT INTO public.job_daily_slots (user_email, slot_date, slot_no, job_id)
    SELECT v_email, v_today, n.slot_no, n.job_id
    FROM   numbered n
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN QUERY
  SELECT
    s.slot_no,
    j.id,
    j.title,
    j.company_name,
    j.location_text,
    j.employment_type,
    j.work_mode,
    j.stipend_salary_label,
    j.stipend_min,
    j.stipend_max,
    j.currency_code,
    j.is_pre_placement_offer,
    j.tag_pills,
    j.application_url,
    j.expires_at,
    s.swiped_at,
    s.swipe_action
  FROM  public.job_daily_slots s
  JOIN  public.jobs j ON j.id = s.job_id
  WHERE s.user_email = v_email
    AND s.slot_date  = v_today
  ORDER BY s.slot_no;
END;
$$;

-- ─────────────────────────────────────────────
-- 2. jobs_record_swipe — respects is_premium
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.jobs_record_swipe(
  p_job_id uuid,
  p_action text,
  p_tz     text DEFAULT 'Asia/Kolkata'
)
RETURNS TABLE (
  success         boolean,
  action          text,
  interacted_count integer,
  is_locked       boolean,
  next_allowed_at timestamptz,
  application_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email              text;
  v_today              date;
  v_interacted         int;
  v_url                text;
  v_slot_id            uuid;
  v_existing_action    text;
  v_existing_swiped_at timestamptz;
  v_is_premium         boolean;
  v_max_slots          int;
BEGIN
  IF lower(p_action) NOT IN ('like', 'pass') THEN
    RAISE EXCEPTION 'INVALID_ACTION';
  END IF;

  v_email := public.app_session_email();
  v_today := public.jobs_today_ist(p_tz);

  PERFORM pg_advisory_xact_lock(hashtextextended(v_email || ':' || v_today::text, 0));

  SELECT COALESCE(p.is_premium, false) INTO v_is_premium
  FROM   public.profiles p
  WHERE  lower(p.email) = v_email
  LIMIT  1;

  v_max_slots := CASE WHEN v_is_premium THEN 5 ELSE 2 END;

  SELECT s.id, s.swipe_action, s.swiped_at
  INTO   v_slot_id, v_existing_action, v_existing_swiped_at
  FROM   public.job_daily_slots s
  WHERE  s.user_email = v_email
    AND  s.slot_date  = v_today
    AND  s.job_id     = p_job_id
  LIMIT 1
  FOR UPDATE;

  IF v_slot_id IS NULL THEN
    RAISE EXCEPTION 'JOB_NOT_IN_TODAY_SLOTS';
  END IF;

  -- Already swiped — return current state idempotently
  IF v_existing_swiped_at IS NOT NULL THEN
    SELECT COUNT(*)::int INTO v_interacted
    FROM   public.job_daily_slots s
    WHERE  s.user_email = v_email
      AND  s.slot_date  = v_today
      AND  s.swiped_at  IS NOT NULL;

    IF lower(COALESCE(v_existing_action, '')) = 'like' THEN
      SELECT j.application_url INTO v_url FROM public.jobs j WHERE j.id = p_job_id;
    ELSE
      v_url := NULL;
    END IF;

    RETURN QUERY SELECT
      true,
      lower(COALESCE(v_existing_action, p_action)),
      v_interacted,
      (v_interacted >= v_max_slots),
      public.jobs_next_reset_ist(v_today, p_tz),
      v_url;
    RETURN;
  END IF;

  SELECT COUNT(*)::int INTO v_interacted
  FROM   public.job_daily_slots s
  WHERE  s.user_email = v_email
    AND  s.slot_date  = v_today
    AND  s.swiped_at  IS NOT NULL;

  IF v_interacted >= v_max_slots THEN
    RAISE EXCEPTION 'DAILY_LIMIT_REACHED';
  END IF;

  UPDATE public.job_daily_slots s
  SET    swipe_action    = lower(p_action),
         swiped_at       = now(),
         link_opened_at  = CASE WHEN lower(p_action) = 'like' THEN now() ELSE s.link_opened_at END
  WHERE  s.id = v_slot_id;

  INSERT INTO public.job_swipes (user_email, job_id, action, swiped_at, slot_date)
  VALUES (v_email, p_job_id, lower(p_action), now(), v_today)
  ON CONFLICT (user_email, job_id)
  DO UPDATE SET action = EXCLUDED.action, swiped_at = EXCLUDED.swiped_at, slot_date = EXCLUDED.slot_date;

  IF lower(p_action) = 'like' THEN
    SELECT j.application_url INTO v_url FROM public.jobs j WHERE j.id = p_job_id;
  ELSE
    v_url := NULL;
  END IF;

  SELECT COUNT(*)::int INTO v_interacted
  FROM   public.job_daily_slots s
  WHERE  s.user_email = v_email
    AND  s.slot_date  = v_today
    AND  s.swiped_at  IS NOT NULL;

  RETURN QUERY SELECT
    true,
    lower(p_action),
    v_interacted,
    (v_interacted >= v_max_slots),
    public.jobs_next_reset_ist(v_today, p_tz),
    v_url;
END;
$$;

-- ─────────────────────────────────────────────
-- 3. jobs_get_status — respects is_premium
--    (returns daily_limit + is_locked correctly)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.jobs_get_status(p_tz text DEFAULT 'Asia/Kolkata')
RETURNS TABLE (
  daily_limit      integer,
  interacted_count integer,
  remaining_count  integer,
  is_locked        boolean,
  next_reset_at    timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_email      text;
  v_today      date;
  v_interacted int;
  v_is_premium boolean;
  v_max_slots  int;
BEGIN
  v_email := public.app_session_email();
  v_today := public.jobs_today_ist(p_tz);

  SELECT COALESCE(p.is_premium, false) INTO v_is_premium
  FROM   public.profiles p
  WHERE  lower(p.email) = v_email LIMIT 1;

  v_max_slots := CASE WHEN v_is_premium THEN 5 ELSE 2 END;

  SELECT COUNT(*)::int INTO v_interacted
  FROM   public.job_daily_slots s
  WHERE  s.user_email = v_email AND s.slot_date = v_today AND s.swiped_at IS NOT NULL;

  RETURN QUERY SELECT
    v_max_slots,
    v_interacted,
    GREATEST(0, v_max_slots - v_interacted),
    (v_interacted >= v_max_slots),
    public.jobs_next_reset_ist(v_today, p_tz);
END;
$$;

-- ─────────────────────────────────────────────
-- 4. join_community — respects is_premium
--    Free: 5 total joins, Premium: 15
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.join_community(
  p_community_id uuid,
  p_email        text
)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_join_type      text;
  v_member_count   int;
  v_is_premium     boolean;
  v_max_joins      int;
  v_existing_role  text;
  v_req_status     text;
BEGIN
  -- Get community join type
  SELECT join_type INTO v_join_type
  FROM   communities
  WHERE  id = p_community_id;

  IF NOT FOUND THEN RETURN 'NOT_FOUND'; END IF;

  -- Already a member?
  SELECT role INTO v_existing_role
  FROM   community_members
  WHERE  community_id = p_community_id AND user_email = lower(p_email)
    AND  status = 'approved';

  IF FOUND THEN RETURN 'ALREADY_MEMBER'; END IF;

  -- Already sent request?
  SELECT status INTO v_req_status
  FROM   community_join_requests
  WHERE  community_id = p_community_id AND user_email = lower(p_email)
    AND  status = 'pending';

  IF FOUND THEN RETURN 'REQUEST_PENDING'; END IF;

  -- Check premium & compute limit
  SELECT COALESCE(is_premium, false) INTO v_is_premium
  FROM   profiles
  WHERE  lower(email) = lower(p_email) LIMIT 1;

  v_max_joins := CASE WHEN v_is_premium THEN 15 ELSE 5 END;

  SELECT COUNT(*)::int INTO v_member_count
  FROM   community_members
  WHERE  user_email = lower(p_email) AND status = 'approved';

  IF v_member_count >= v_max_joins THEN
    RETURN 'LIMIT_REACHED';
  END IF;

  IF v_join_type = 'open' THEN
    INSERT INTO community_members (community_id, user_email, role, status)
    VALUES (p_community_id, lower(p_email), 'member', 'approved');
    RETURN 'JOINED';
  ELSE
    INSERT INTO community_join_requests (community_id, user_email, status)
    VALUES (p_community_id, lower(p_email), 'pending');
    RETURN 'REQUEST_SENT';
  END IF;
END;
$$;

COMMIT;
