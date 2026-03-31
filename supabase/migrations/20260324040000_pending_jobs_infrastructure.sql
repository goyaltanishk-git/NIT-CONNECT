BEGIN;

CREATE TABLE IF NOT EXISTS public.pending_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_source_job_id text,
  source_api text,
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
  guessed_branches text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  scraped_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by_email text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_api, raw_source_job_id)
);

ALTER TABLE public.pending_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pending_jobs_no_direct_access" ON public.pending_jobs;

CREATE POLICY "pending_jobs_no_direct_access" 
ON public.pending_jobs 
FOR ALL TO anon, authenticated 
USING (false) WITH CHECK (false);

REVOKE ALL ON TABLE public.pending_jobs FROM anon, authenticated;

-- 1. Get Pending Jobs Count
CREATE OR REPLACE FUNCTION public.jobs_fetch_pending_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_count integer;
BEGIN
  v_email := public.app_session_email();
  
  IF NOT EXISTS (
    SELECT 1 FROM public.job_admins a WHERE a.email = v_email AND a.is_active = true
  ) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED_ADMIN';
  END IF;

  SELECT COUNT(*)::int INTO v_count
  FROM public.pending_jobs
  WHERE status = 'pending';
  
  RETURN v_count;
END;
$$;

-- 2. Get Pending Jobs for Review
CREATE OR REPLACE FUNCTION public.jobs_get_pending_for_review(p_offset int DEFAULT 0, p_limit int DEFAULT 20)
RETURNS SETOF public.pending_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  v_email := public.app_session_email();
  
  IF NOT EXISTS (
    SELECT 1 FROM public.job_admins a WHERE a.email = v_email AND a.is_active = true
  ) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED_ADMIN';
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.pending_jobs
  WHERE status = 'pending'
  ORDER BY scraped_at DESC
  OFFSET p_offset
  LIMIT p_limit;
END;
$$;

-- 3. Approve Pending Job
CREATE OR REPLACE FUNCTION public.jobs_approve_pending(
  p_pending_id uuid,
  p_final_target_groups jsonb,
  p_expires_at timestamptz DEFAULT NULL
)
RETURNS TABLE (job_id uuid, success boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_pending public.pending_jobs;
  v_job_id uuid;
  v_inserted int;
  v_total_groups int;
  v_invalid_groups int;
BEGIN
  v_email := public.app_session_email();
  
  IF NOT EXISTS (
    SELECT 1 FROM public.job_admins a WHERE a.email = v_email AND a.is_active = true
  ) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED_ADMIN';
  END IF;

  IF p_final_target_groups IS NULL OR jsonb_typeof(p_final_target_groups) <> 'array' THEN
    RAISE EXCEPTION 'TARGET_GROUPS_MUST_BE_ARRAY';
  END IF;

  SELECT jsonb_array_length(p_final_target_groups) INTO v_total_groups;

  IF v_total_groups = 0 THEN
    RAISE EXCEPTION 'AT_LEAST_ONE_TARGET_GROUP_REQUIRED';
  END IF;

  SELECT count(*) INTO v_invalid_groups
  FROM jsonb_array_elements(p_final_target_groups) AS elem
  WHERE NOT (
    elem ? 'branch' AND 
    elem ? 'graduation_batch' AND 
    (elem->>'branch') IS NOT NULL AND 
    (elem->>'branch') <> '' AND
    (elem->>'graduation_batch')::int BETWEEN 2020 AND 2100
  );

  IF v_invalid_groups > 0 THEN
    RAISE EXCEPTION 'INVALID_TARGET_GROUP_FORMAT';
  END IF;

  SELECT * INTO v_pending FROM public.pending_jobs WHERE id = p_pending_id AND status = 'pending';
  
  IF v_pending.id IS NULL THEN
    RAISE EXCEPTION 'PENDING_JOB_NOT_FOUND_OR_NOT_PENDING';
  END IF;

  -- Insert into jobs table
  INSERT INTO public.jobs (
    title, company_name, location_text, employment_type, work_mode,
    stipend_salary_label, stipend_min, stipend_max, currency_code,
    application_url, is_pre_placement_offer, tag_pills, expires_at, posted_by_email
  ) VALUES (
    v_pending.title, v_pending.company_name, v_pending.location_text, v_pending.employment_type, v_pending.work_mode,
    v_pending.stipend_salary_label, v_pending.stipend_min, v_pending.stipend_max, v_pending.currency_code,
    v_pending.application_url, v_pending.is_pre_placement_offer, v_pending.tag_pills, 
    COALESCE(p_expires_at, now() + interval '7 days'), v_email
  ) RETURNING id INTO v_job_id;

  -- Insert target groups
  WITH new_targets AS (
    SELECT DISTINCT
      trim(elem->>'branch') AS branch_name,
      (elem->>'graduation_batch')::int AS grad_batch
    FROM jsonb_array_elements(p_final_target_groups) AS elem
  )
  INSERT INTO public.job_target_groups (job_id, target_branch, target_graduation_batch)
  SELECT v_job_id, branch_name, grad_batch
  FROM new_targets;

  -- Update pending job status
  UPDATE public.pending_jobs
  SET status = 'approved',
      reviewed_by_email = v_email,
      reviewed_at = now(),
      updated_at = now()
  WHERE id = p_pending_id;

  RETURN QUERY SELECT v_job_id, true;
END;
$$;

-- 4. Reject Pending Job
CREATE OR REPLACE FUNCTION public.jobs_reject_pending(
  p_pending_id uuid,
  p_reason text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  v_email := public.app_session_email();
  
  IF NOT EXISTS (
    SELECT 1 FROM public.job_admins a WHERE a.email = v_email AND a.is_active = true
  ) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED_ADMIN';
  END IF;

  UPDATE public.pending_jobs
  SET status = 'rejected',
      rejection_reason = p_reason,
      reviewed_by_email = v_email,
      reviewed_at = now(),
      updated_at = now()
  WHERE id = p_pending_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PENDING_JOB_NOT_FOUND_OR_NOT_PENDING';
  END IF;

  RETURN true;
END;
$$;

-- 5. Update Pending Job Branches (Optional override before approval)
CREATE OR REPLACE FUNCTION public.jobs_update_pending_branches(
  p_pending_id uuid,
  p_new_branches text[]
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  v_email := public.app_session_email();
  
  IF NOT EXISTS (
    SELECT 1 FROM public.job_admins a WHERE a.email = v_email AND a.is_active = true
  ) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED_ADMIN';
  END IF;

  UPDATE public.pending_jobs
  SET guessed_branches = p_new_branches,
      updated_at = now()
  WHERE id = p_pending_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PENDING_JOB_NOT_FOUND_OR_NOT_PENDING';
  END IF;

  RETURN true;
END;
$$;

COMMIT;