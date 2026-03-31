BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Session helper used by jobs RPCs
CREATE OR REPLACE FUNCTION public.app_session_email()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
DECLARE
  v_email text;
BEGIN
  v_email := lower(nullif(current_setting('app.current_user_email', true), ''));
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'SESSION_EMAIL_MISSING';
  END IF;
  RETURN v_email;
END;
$$;

CREATE OR REPLACE FUNCTION public.jobs_today_ist(p_tz text DEFAULT 'Asia/Kolkata')
RETURNS date
LANGUAGE sql
STABLE
AS $$
  SELECT (now() AT TIME ZONE COALESCE(nullif(p_tz, ''), 'Asia/Kolkata'))::date;
$$;

CREATE OR REPLACE FUNCTION public.jobs_next_reset_ist(
  p_date date DEFAULT NULL,
  p_tz text DEFAULT 'Asia/Kolkata'
)
RETURNS timestamptz
LANGUAGE sql
STABLE
AS $$
  SELECT (((COALESCE(p_date, public.jobs_today_ist(p_tz)) + 1)::timestamp) AT TIME ZONE COALESCE(nullif(p_tz, ''), 'Asia/Kolkata'));
$$;

-- Core jobs tables (created if missing)
CREATE TABLE IF NOT EXISTS public.job_admins (
  email text PRIMARY KEY,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.job_admins (email, is_active)
VALUES
  ('123103106@nitkkr.ac.in', true),
  ('123103078@nitkkr.ac.in', true)
ON CONFLICT (email) DO UPDATE
SET is_active = EXCLUDED.is_active;

CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  company_name text NOT NULL,
  location_text text NOT NULL,
  employment_type text NOT NULL CHECK (employment_type IN ('internship', 'full_time', 'part_time', 'contract')),
  work_mode text NOT NULL CHECK (work_mode IN ('onsite', 'remote', 'hybrid')),
  stipend_salary_label text,
  stipend_min numeric,
  stipend_max numeric,
  currency_code text NOT NULL DEFAULT 'INR',
  application_url text NOT NULL,
  is_pre_placement_offer boolean NOT NULL DEFAULT false,
  tag_pills text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
  posted_by_email text NOT NULL,
  posted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.job_target_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  target_branch text NOT NULL,
  target_graduation_batch integer NOT NULL CHECK (target_graduation_batch BETWEEN 2020 AND 2100),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, target_branch, target_graduation_batch)
);

CREATE TABLE IF NOT EXISTS public.job_daily_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  slot_date date NOT NULL,
  slot_no smallint NOT NULL CHECK (slot_no BETWEEN 1 AND 2),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE RESTRICT,
  served_at timestamptz NOT NULL DEFAULT now(),
  swipe_action text CHECK (swipe_action IN ('like', 'pass')),
  swiped_at timestamptz,
  link_opened_at timestamptz,
  UNIQUE (user_email, slot_date, slot_no),
  UNIQUE (user_email, slot_date, job_id)
);

CREATE TABLE IF NOT EXISTS public.job_swipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('like', 'pass')),
  swiped_at timestamptz NOT NULL DEFAULT now(),
  slot_date date NOT NULL,
  UNIQUE (user_email, job_id)
);

CREATE INDEX IF NOT EXISTS idx_jobs_active_expiry ON public.jobs (status, expires_at);
CREATE INDEX IF NOT EXISTS idx_job_target_groups_lookup ON public.job_target_groups (target_branch, target_graduation_batch);
CREATE INDEX IF NOT EXISTS idx_job_daily_slots_user_date ON public.job_daily_slots (user_email, slot_date);
CREATE INDEX IF NOT EXISTS idx_job_swipes_user_job ON public.job_swipes (user_email, job_id);

ALTER TABLE public.job_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_target_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_daily_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_swipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "job_admins_no_direct_access" ON public.job_admins;
DROP POLICY IF EXISTS "jobs_no_direct_access" ON public.jobs;
DROP POLICY IF EXISTS "job_target_groups_no_direct_access" ON public.job_target_groups;
DROP POLICY IF EXISTS "job_daily_slots_no_direct_access" ON public.job_daily_slots;
DROP POLICY IF EXISTS "job_swipes_no_direct_access" ON public.job_swipes;

CREATE POLICY "job_admins_no_direct_access" ON public.job_admins FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "jobs_no_direct_access" ON public.jobs FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "job_target_groups_no_direct_access" ON public.job_target_groups FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "job_daily_slots_no_direct_access" ON public.job_daily_slots FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "job_swipes_no_direct_access" ON public.job_swipes FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

REVOKE ALL ON TABLE public.job_admins FROM anon, authenticated;
REVOKE ALL ON TABLE public.jobs FROM anon, authenticated;
REVOKE ALL ON TABLE public.job_target_groups FROM anon, authenticated;
REVOKE ALL ON TABLE public.job_daily_slots FROM anon, authenticated;
REVOKE ALL ON TABLE public.job_swipes FROM anon, authenticated;

-- Core RPCs
CREATE OR REPLACE FUNCTION public.jobs_admin_can_add()
RETURNS TABLE (can_add boolean, actor_email text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  v_email := public.app_session_email();
  RETURN QUERY
  SELECT EXISTS (
    SELECT 1 FROM public.job_admins a WHERE a.email = v_email AND a.is_active = true
  ), v_email;
END;
$$;

CREATE OR REPLACE FUNCTION public.jobs_get_daily_status(p_tz text DEFAULT 'Asia/Kolkata')
RETURNS TABLE (
  today date,
  daily_limit integer,
  served_count integer,
  interacted_count integer,
  remaining_to_serve integer,
  remaining_to_interact integer,
  is_locked boolean,
  resets_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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

  RETURN QUERY
  SELECT
    v_today,
    2,
    v_served,
    v_interacted,
    GREATEST(0, 2 - v_served),
    GREATEST(0, 2 - v_interacted),
    (v_interacted >= 2),
    public.jobs_next_reset_ist(v_today, p_tz);
END;
$$;

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

  v_remaining := GREATEST(0, 2 - v_existing);

  IF v_remaining > 0 THEN
    WITH free_slots AS (
      SELECT gs AS slot_no
      FROM generate_series(1, 2) gs
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
    ), numbered AS (
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
$$;

DROP FUNCTION IF EXISTS public.jobs_record_swipe(uuid, text);
DROP FUNCTION IF EXISTS public.jobs_record_swipe(uuid, text, text);

CREATE OR REPLACE FUNCTION public.jobs_record_swipe(
  p_job_id uuid,
  p_action text,
  p_tz text DEFAULT 'Asia/Kolkata'
)
RETURNS TABLE (
  success boolean,
  action text,
  interacted_count integer,
  is_locked boolean,
  next_allowed_at timestamptz,
  application_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_today date;
  v_interacted int;
  v_url text;
  v_slot_id uuid;
BEGIN
  IF lower(p_action) NOT IN ('like', 'pass') THEN
    RAISE EXCEPTION 'INVALID_ACTION';
  END IF;

  v_email := public.app_session_email();
  v_today := public.jobs_today_ist(p_tz);

  PERFORM pg_advisory_xact_lock(hashtextextended(v_email || ':' || v_today::text, 0));

  SELECT s.id INTO v_slot_id
  FROM public.job_daily_slots s
  WHERE s.user_email = v_email
    AND s.slot_date = v_today
    AND s.job_id = p_job_id
  LIMIT 1
  FOR UPDATE;

  IF v_slot_id IS NULL THEN
    RAISE EXCEPTION 'JOB_NOT_IN_TODAY_SLOTS';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.job_daily_slots s
    WHERE s.id = v_slot_id
      AND s.swiped_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'ALREADY_SWIPED';
  END IF;

  SELECT COUNT(*)::int INTO v_interacted
  FROM public.job_daily_slots s
  WHERE s.user_email = v_email
    AND s.slot_date = v_today
    AND s.swiped_at IS NOT NULL;

  IF v_interacted >= 2 THEN
    RAISE EXCEPTION 'DAILY_LIMIT_REACHED';
  END IF;

  UPDATE public.job_daily_slots s
  SET
    swipe_action = lower(p_action),
    swiped_at = now(),
    link_opened_at = CASE WHEN lower(p_action) = 'like' THEN now() ELSE s.link_opened_at END
  WHERE s.id = v_slot_id;

  INSERT INTO public.job_swipes (user_email, job_id, action, swiped_at, slot_date)
  VALUES (v_email, p_job_id, lower(p_action), now(), v_today)
  ON CONFLICT (user_email, job_id)
  DO UPDATE
  SET action = EXCLUDED.action,
      swiped_at = EXCLUDED.swiped_at,
      slot_date = EXCLUDED.slot_date;

  IF lower(p_action) = 'like' THEN
    SELECT j.application_url INTO v_url
    FROM public.jobs j
    WHERE j.id = p_job_id;
  ELSE
    v_url := NULL;
  END IF;

  SELECT COUNT(*)::int INTO v_interacted
  FROM public.job_daily_slots s
  WHERE s.user_email = v_email
    AND s.slot_date = v_today
    AND s.swiped_at IS NOT NULL;

  RETURN QUERY
  SELECT
    true,
    lower(p_action),
    v_interacted,
    (v_interacted >= 2),
    public.jobs_next_reset_ist(v_today, p_tz),
    v_url;
END;
$$;

CREATE OR REPLACE FUNCTION public.jobs_admin_add_job(
  p_title text,
  p_company_name text,
  p_location_text text,
  p_employment_type text,
  p_work_mode text,
  p_stipend_salary_label text DEFAULT NULL,
  p_stipend_min numeric DEFAULT NULL,
  p_stipend_max numeric DEFAULT NULL,
  p_currency_code text DEFAULT 'INR',
  p_application_url text DEFAULT NULL,
  p_is_pre_placement_offer boolean DEFAULT false,
  p_tag_pills text[] DEFAULT '{}',
  p_expires_at timestamptz DEFAULT NULL,
  p_target_groups jsonb DEFAULT '[]'::jsonb
)
RETURNS TABLE (
  job_id uuid,
  inserted_targets integer,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_job_id uuid;
  v_inserted int;
  v_total_groups int;
  v_invalid_groups int;
  v_created_at timestamptz;
BEGIN
  v_email := public.app_session_email();

  IF NOT EXISTS (
    SELECT 1 FROM public.job_admins a WHERE a.email = v_email AND a.is_active = true
  ) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED_ADMIN';
  END IF;

  IF p_target_groups IS NULL OR jsonb_typeof(p_target_groups) <> 'array' THEN
    RAISE EXCEPTION 'TARGET_GROUPS_MUST_BE_ARRAY';
  END IF;

  SELECT jsonb_array_length(p_target_groups) INTO v_total_groups;

  IF v_total_groups = 0 THEN
    RAISE EXCEPTION 'TARGET_GROUPS_REQUIRED';
  END IF;

  SELECT COUNT(*)::int INTO v_invalid_groups
  FROM jsonb_array_elements(p_target_groups) elem
  WHERE trim(COALESCE(elem->>'branch', '')) = ''
    OR COALESCE(elem->>'graduation_batch', '') !~ '^[0-9]{4}$';

  IF v_invalid_groups = v_total_groups THEN
    RAISE EXCEPTION 'ALL_GROUPS_INVALID: branch cannot be empty, graduation_batch must be YYYY format';
  END IF;

  INSERT INTO public.jobs (
    title,
    company_name,
    location_text,
    employment_type,
    work_mode,
    stipend_salary_label,
    stipend_min,
    stipend_max,
    currency_code,
    application_url,
    is_pre_placement_offer,
    tag_pills,
    status,
    posted_by_email,
    expires_at,
    updated_at
  )
  VALUES (
    p_title,
    p_company_name,
    p_location_text,
    lower(p_employment_type),
    lower(p_work_mode),
    p_stipend_salary_label,
    p_stipend_min,
    p_stipend_max,
    upper(p_currency_code),
    p_application_url,
    p_is_pre_placement_offer,
    COALESCE(p_tag_pills, '{}'),
    'active',
    v_email,
    p_expires_at,
    now()
  )
  RETURNING jobs.id, jobs.created_at INTO v_job_id, v_created_at;

  INSERT INTO public.job_target_groups (job_id, target_branch, target_graduation_batch)
  SELECT
    v_job_id,
    trim(elem->>'branch'),
    (elem->>'graduation_batch')::integer
  FROM jsonb_array_elements(p_target_groups) elem
  WHERE trim(COALESCE(elem->>'branch', '')) <> ''
    AND elem->>'graduation_batch' ~ '^[0-9]{4}$'
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF v_inserted = 0 THEN
    RAISE EXCEPTION 'NO_VALID_TARGET_GROUPS_INSERTED';
  END IF;

  RETURN QUERY
  SELECT v_job_id, v_inserted, v_created_at;
END;
$$;

-- Fix ambiguous variable/table reference in group creation function
CREATE OR REPLACE FUNCTION public.jobs_create_target_group(
  p_group_name text,
  p_branches text[]
)
RETURNS TABLE (
  group_id uuid,
  group_name text,
  branches text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_group_id uuid;
  v_name text;
BEGIN
  v_email := public.app_session_email();

  IF NOT EXISTS (
    SELECT 1
    FROM public.job_admins a
    WHERE a.email = v_email
      AND a.is_active = true
  ) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED_ADMIN';
  END IF;

  v_name := lower(trim(COALESCE(p_group_name, '')));
  IF v_name = '' THEN
    RAISE EXCEPTION 'GROUP_NAME_REQUIRED';
  END IF;

  IF p_branches IS NULL OR cardinality(p_branches) = 0 THEN
    RAISE EXCEPTION 'BRANCHES_REQUIRED';
  END IF;

  INSERT INTO public.job_branch_groups (name, created_by_email, is_active, updated_at)
  VALUES (v_name, v_email, true, now())
  ON CONFLICT (name)
  DO UPDATE SET
    is_active = true,
    updated_at = now()
  RETURNING id INTO v_group_id;

  DELETE FROM public.job_branch_group_members m
  WHERE m.group_id = v_group_id;

  INSERT INTO public.job_branch_group_members (group_id, branch)
  SELECT v_group_id, trim(b)
  FROM unnest(p_branches) AS b
  WHERE trim(COALESCE(b, '')) <> ''
  ON CONFLICT DO NOTHING;

  RETURN QUERY
  SELECT
    g.id,
    g.name,
    COALESCE(array_agg(m.branch ORDER BY m.branch), '{}'::text[]) AS branches
  FROM public.job_branch_groups g
  LEFT JOIN public.job_branch_group_members m ON m.group_id = g.id
  WHERE g.id = v_group_id
  GROUP BY g.id, g.name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.jobs_admin_can_add() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.jobs_get_daily_status(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.jobs_get_daily_feed(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.jobs_record_swipe(uuid, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.jobs_admin_add_job(
  text, text, text, text, text, text, numeric, numeric, text, text, boolean, text[], timestamptz, jsonb
) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.jobs_create_target_group(text, text[]) TO anon, authenticated;

COMMIT;
