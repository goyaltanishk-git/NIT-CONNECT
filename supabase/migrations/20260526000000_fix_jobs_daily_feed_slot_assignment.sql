BEGIN;

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
  v_email text;
  v_today date;
  v_branch text;
  v_batch int;
  v_existing int;
  v_remaining int;
  v_max_slots int := 2;
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
$$;

COMMIT;