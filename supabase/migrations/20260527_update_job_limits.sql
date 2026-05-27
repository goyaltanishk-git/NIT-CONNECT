-- Migration: Update job feed and status functions to use per-user limits
-- Date: 2026-05-27
-- Ensures premium users receive limits from get_job_daily_limit(email)
-- and non-premium users continue to receive 2 slots.

SET search_path = public;

-- jobs_get_daily_feed() - no-arg
CREATE OR REPLACE FUNCTION public.jobs_get_daily_feed()
 RETURNS TABLE(slot_no smallint, job_id uuid, title text, company_name text, location_text text, employment_type text, work_mode text, stipend_salary_label text, stipend_min numeric, stipend_max numeric, currency_code text, is_pre_placement_offer boolean, tag_pills text[], application_url text, expires_at timestamp with time zone, swiped_at timestamp with time zone, swipe_action text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_email text;
  v_today date;
  v_branch text;
  v_batch int;
  v_existing int;
  v_remaining int;
  v_max_slots int;
BEGIN
  v_email := public.app_session_email();
  v_today := public.jobs_today_ist();

  -- Serialize per user/day to prevent race conditions
  PERFORM pg_advisory_xact_lock(hashtextextended(v_email || ':' || v_today::text, 0));

  SELECT p.branch, p.graduation_batch
    INTO v_branch, v_batch
  FROM public.profiles p
  WHERE lower(p.email) = v_email
  LIMIT 1;

  IF v_branch IS NULL OR v_batch IS NULL THEN
    RETURN;
  END IF;

  -- Expiry-safe behavior:
  -- remove unswiped slots if job is no longer active/valid
  DELETE FROM public.job_daily_slots s
  USING public.jobs j
  WHERE s.user_email = v_email
    AND s.slot_date = v_today
    AND s.swiped_at IS NULL
    AND s.job_id = j.id
    AND (
      j.status <> 'active'
      OR (j.expires_at IS NOT NULL AND j.expires_at <= now())
    );

  SELECT COUNT(*)::int
    INTO v_existing
  FROM public.job_daily_slots s
  WHERE s.user_email = v_email
    AND s.slot_date = v_today;

  -- Determine per-user slot limit (premium vs free)
  v_max_slots := public.get_job_daily_limit(v_email);

  v_remaining := GREATEST(0, v_max_slots - v_existing);

  IF v_remaining > 0 THEN
    WITH free_slots AS (
      SELECT gs::smallint AS slot_no
      FROM generate_series(1, v_max_slots) gs
      WHERE NOT EXISTS (
        SELECT 1
        FROM public.job_daily_slots s
        WHERE s.user_email = v_email
          AND s.slot_date = v_today
          AND s.slot_no = gs
      )
      ORDER BY gs
      LIMIT v_remaining
    ),
    candidates AS (
      SELECT j.id
      FROM public.jobs j
      WHERE j.status = 'active'
        AND (j.expires_at IS NULL OR j.expires_at > now())
        AND EXISTS (
          SELECT 1
          FROM public.job_target_groups tg
          WHERE tg.job_id = j.id
            AND lower(tg.target_branch) = lower(v_branch)
            AND tg.target_graduation_batch = v_batch
        )
        AND NOT EXISTS (
          SELECT 1
          FROM public.job_swipes js
          WHERE js.user_email = v_email
            AND js.job_id = j.id
        )
        AND NOT EXISTS (
          SELECT 1
          FROM public.job_daily_slots ds
          WHERE ds.user_email = v_email
            AND ds.slot_date = v_today
            AND ds.job_id = j.id
        )
      ORDER BY md5(j.id::text || v_email || v_today::text)
      LIMIT v_remaining
    ),
    numbered AS (
      SELECT c.id AS job_id, f.slot_no
      FROM candidates c
      JOIN free_slots f ON true
      ORDER BY f.slot_no
      LIMIT v_remaining
    )
    INSERT INTO public.job_daily_slots (user_email, slot_date, slot_no, job_id)
    SELECT v_email, v_today, n.slot_no, n.job_id
    FROM numbered n
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
  FROM public.job_daily_slots s
  JOIN public.jobs j ON j.id = s.job_id
  WHERE s.user_email = v_email
    AND s.slot_date = v_today
    AND j.status = 'active'
    AND (j.expires_at IS NULL OR j.expires_at > now())
  ORDER BY s.slot_no;
END;
$function$;

-- jobs_get_daily_feed(p_tz text)
CREATE OR REPLACE FUNCTION public.jobs_get_daily_feed(p_tz text DEFAULT 'Asia/Kolkata'::text)
 RETURNS TABLE(slot_no smallint, job_id uuid, title text, company_name text, location_text text, employment_type text, work_mode text, stipend_salary_label text, stipend_min numeric, stipend_max numeric, currency_code text, is_pre_placement_offer boolean, tag_pills text[], application_url text, expires_at timestamp with time zone, swiped_at timestamp with time zone, swipe_action text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_email text;
  v_today date;
  v_branch text;
  v_batch int;
  v_existing int;
  v_remaining int;
  v_max_slots int;
BEGIN
  v_email := public.app_session_email();
  v_today := public.jobs_today_ist(p_tz);

  PERFORM pg_advisory_xact_lock(hashtextextended(v_email || ':' || v_today::text, 0));

  SELECT p.branch, p.graduation_batch
  INTO v_branch, v_batch
  FROM public.profiles p
  WHERE lower(p.email) = v_email
  LIMIT 1;

  IF v_branch IS NULL OR v_batch IS NULL THEN
    RETURN;
  END IF;

  DELETE FROM public.job_daily_slots s
  USING public.jobs j
  WHERE s.user_email = v_email
    AND s.slot_date = v_today
    AND s.swiped_at IS NULL
    AND s.job_id = j.id
    AND (j.status <> 'active' OR (j.expires_at IS NOT NULL AND j.expires_at <= now()));

  SELECT COUNT(*)::int INTO v_existing
  FROM public.job_daily_slots s
  WHERE s.user_email = v_email AND s.slot_date = v_today;

  -- Determine per-user slot limit (premium vs free)
  v_max_slots := public.get_job_daily_limit(v_email);

  v_remaining := GREATEST(0, v_max_slots - v_existing);

  IF v_remaining > 0 THEN
    WITH free_slots AS (
      SELECT gs::smallint AS slot_no,
             row_number() OVER (ORDER BY gs) AS rn
      FROM generate_series(1, v_max_slots) gs
      WHERE NOT EXISTS (
        SELECT 1
        FROM public.job_daily_slots s
        WHERE s.user_email = v_email
          AND s.slot_date = v_today
          AND s.slot_no = gs
      )
      ORDER BY gs
      LIMIT v_remaining
    ), candidates AS (
      SELECT j.id,
             row_number() OVER (ORDER BY md5(j.id::text || v_email || v_today::text)) AS rn
      FROM public.jobs j
      WHERE j.status = 'active'
        AND (j.expires_at IS NULL OR j.expires_at > now())
        AND EXISTS (
          SELECT 1
          FROM public.job_target_groups tg
          WHERE tg.job_id = j.id
            AND lower(tg.target_branch) = lower(v_branch)
            AND tg.target_graduation_batch = v_batch
        )
        AND NOT EXISTS (
          SELECT 1
          FROM public.job_swipes js
          WHERE js.user_email = v_email
            AND js.job_id = j.id
        )
        AND NOT EXISTS (
          SELECT 1
          FROM public.job_daily_slots ds
          WHERE ds.user_email = v_email
            AND ds.slot_date = v_today
            AND ds.job_id = j.id
        )
      LIMIT v_remaining
    ), numbered AS (
      SELECT c.id AS job_id, f.slot_no
      FROM candidates c
      JOIN free_slots f USING (rn)
    )
    INSERT INTO public.job_daily_slots (user_email, slot_date, slot_no, job_id)
    SELECT v_email, v_today, n.slot_no, n.job_id
    FROM numbered n
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
  FROM public.job_daily_slots s
  JOIN public.jobs j ON j.id = s.job_id
  WHERE s.user_email = v_email
    AND s.slot_date = v_today
    AND s.swiped_at IS NULL
    AND j.status = 'active'
    AND (j.expires_at IS NULL OR j.expires_at > now())
  ORDER BY s.slot_no;
END;
$function$;

-- jobs_get_daily_status(p_tz text)
CREATE OR REPLACE FUNCTION public.jobs_get_daily_status(p_tz text DEFAULT 'Asia/Kolkata'::text)
 RETURNS TABLE(today date, daily_limit integer, served_count integer, interacted_count integer, remaining_to_serve integer, remaining_to_interact integer, is_locked boolean, resets_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_email text;
  v_today date;
  v_served int;
  v_interacted int;
BEGIN
  v_email := public.app_session_email();
  v_today := public.jobs_today_ist(p_tz);

  SELECT COUNT(*)::int INTO v_served
  FROM public.job_daily_slots s
  WHERE s.user_email = v_email AND s.slot_date = v_today;

  SELECT COUNT(*)::int INTO v_interacted
  FROM public.job_daily_slots s
  WHERE s.user_email = v_email AND s.slot_date = v_today AND s.swiped_at IS NOT NULL;

  -- Determine daily limit per user
  RETURN QUERY
  SELECT
    v_today,
    public.get_job_daily_limit(v_email) AS daily_limit,
    v_served,
    v_interacted,
    GREATEST(0, public.get_job_daily_limit(v_email) - v_served) AS remaining_to_serve,
    GREATEST(0, public.get_job_daily_limit(v_email) - v_interacted) AS remaining_to_interact,
    (v_interacted >= public.get_job_daily_limit(v_email)) AS is_locked,
    public.jobs_next_reset_ist(v_today, p_tz);
END;
$function$;

-- jobs_get_daily_status() - no-arg
CREATE OR REPLACE FUNCTION public.jobs_get_daily_status()
 RETURNS TABLE(today date, daily_limit integer, served_count integer, interacted_count integer, remaining_to_serve integer, remaining_to_interact integer, is_locked boolean, resets_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_email text;
  v_today date;
  v_served int;
  v_interacted int;
BEGIN
  v_email := public.app_session_email();
  v_today := public.jobs_today_ist();

  SELECT COUNT(*)::int
    INTO v_served
  FROM public.job_daily_slots s
  WHERE s.user_email = v_email
    AND s.slot_date = v_today;

  SELECT COUNT(*)::int
    INTO v_interacted
  FROM public.job_daily_slots s
  WHERE s.user_email = v_email
    AND s.slot_date = v_today
    AND s.swiped_at IS NOT NULL;

  RETURN QUERY
  SELECT
    v_today,
    public.get_job_daily_limit(v_email) AS daily_limit,
    v_served,
    v_interacted,
    GREATEST(0, public.get_job_daily_limit(v_email) - v_served) AS remaining_to_serve,
    GREATEST(0, public.get_job_daily_limit(v_email) - v_interacted) AS remaining_to_interact,
    (v_interacted >= public.get_job_daily_limit(v_email)) AS is_locked,
    public.jobs_next_reset_ist(v_today);
END;
$function$;

-- End of migration
