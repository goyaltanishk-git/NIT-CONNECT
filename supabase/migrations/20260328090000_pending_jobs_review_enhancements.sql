BEGIN;

ALTER TABLE public.pending_jobs
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS guessed_batch integer,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_pending_jobs_status_scraped_at
  ON public.pending_jobs (status, scraped_at DESC);

CREATE INDEX IF NOT EXISTS idx_pending_jobs_status_expires_at
  ON public.pending_jobs (status, expires_at ASC);

CREATE INDEX IF NOT EXISTS idx_pending_jobs_guessed_batch
  ON public.pending_jobs (guessed_batch);

CREATE OR REPLACE FUNCTION public.jobs_get_pending_for_review(
  p_offset int DEFAULT 0,
  p_limit int DEFAULT 20,
  p_sort_by text DEFAULT 'newest',
  p_branch_filter text DEFAULT NULL,
  p_batch_filter integer DEFAULT NULL,
  p_expiring_before timestamptz DEFAULT NULL,
  p_branch_list text[] DEFAULT NULL
)
RETURNS SETOF public.pending_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_sort text;
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

  v_sort := lower(coalesce(p_sort_by, 'newest'));

  IF v_sort NOT IN ('newest', 'oldest', 'expiry_soon', 'batch_desc', 'company_az') THEN
    v_sort := 'newest';
  END IF;

  RETURN QUERY
  SELECT pj.*
  FROM public.pending_jobs pj
  WHERE pj.status = 'pending'
    AND (
      (p_branch_list IS NULL OR array_length(p_branch_list, 1) = 0)
      OR pj.guessed_branches && p_branch_list
    )
    AND (
      p_branch_filter IS NULL
      OR p_branch_filter = ''
      OR p_branch_filter = ANY (coalesce(pj.guessed_branches, '{}'::text[]))
    )
    AND (
      p_batch_filter IS NULL
      OR pj.guessed_batch = p_batch_filter
    )
    AND (
      p_expiring_before IS NULL
      OR pj.expires_at <= p_expiring_before
    )
  ORDER BY
    CASE WHEN v_sort = 'oldest' THEN pj.scraped_at END ASC,
    CASE WHEN v_sort = 'newest' THEN pj.scraped_at END DESC,
    CASE WHEN v_sort = 'expiry_soon' THEN coalesce(pj.expires_at, now() + interval '365 days') END ASC,
    CASE WHEN v_sort = 'batch_desc' THEN coalesce(pj.guessed_batch, 0) END DESC,
    CASE WHEN v_sort = 'company_az' THEN lower(coalesce(pj.company_name, '')) END ASC,
    pj.scraped_at DESC
  OFFSET greatest(p_offset, 0)
  LIMIT least(greatest(p_limit, 1), 200);
END;
$$;

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
    elem ? 'branch'
    AND elem ? 'graduation_batch'
    AND (elem->>'branch') IS NOT NULL
    AND (elem->>'branch') <> ''
    AND (elem->>'graduation_batch')::int BETWEEN 2020 AND 2100
  );

  IF v_invalid_groups > 0 THEN
    RAISE EXCEPTION 'INVALID_TARGET_GROUP_FORMAT';
  END IF;

  SELECT *
  INTO v_pending
  FROM public.pending_jobs
  WHERE id = p_pending_id
    AND status = 'pending';

  IF v_pending.id IS NULL THEN
    RAISE EXCEPTION 'PENDING_JOB_NOT_FOUND_OR_NOT_PENDING';
  END IF;

  INSERT INTO public.jobs (
    title, company_name, location_text, employment_type, work_mode,
    stipend_salary_label, stipend_min, stipend_max, currency_code,
    application_url, is_pre_placement_offer, tag_pills, expires_at, posted_by_email
  )
  VALUES (
    v_pending.title, v_pending.company_name, v_pending.location_text, v_pending.employment_type, v_pending.work_mode,
    v_pending.stipend_salary_label, v_pending.stipend_min, v_pending.stipend_max, v_pending.currency_code,
    v_pending.application_url, v_pending.is_pre_placement_offer, v_pending.tag_pills,
    coalesce(p_expires_at, v_pending.expires_at, now() + interval '7 days'), v_email
  )
  RETURNING id INTO v_job_id;

  WITH new_targets AS (
    SELECT DISTINCT
      trim(elem->>'branch') AS branch_name,
      (elem->>'graduation_batch')::int AS grad_batch
    FROM jsonb_array_elements(p_final_target_groups) AS elem
  )
  INSERT INTO public.job_target_groups (job_id, target_branch, target_graduation_batch)
  SELECT v_job_id, branch_name, grad_batch
  FROM new_targets;

  UPDATE public.pending_jobs
  SET status = 'approved',
      reviewed_by_email = v_email,
      reviewed_at = now(),
      updated_at = now()
  WHERE id = p_pending_id;

  RETURN QUERY SELECT v_job_id, true;
END;
$$;

-- Bulk Reject Function
CREATE OR REPLACE FUNCTION public.jobs_bulk_reject_pending(
  p_pending_ids uuid[],
  p_reason text DEFAULT 'Bulk rejected'
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
  WHERE id = ANY(p_pending_ids)
    AND status = 'pending';

  RETURN true;
END;
$$;

-- Fix for single reject RPC if it was missing or buggy
CREATE OR REPLACE FUNCTION public.jobs_reject_pending(
  p_pending_id uuid,
  p_reason text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.jobs_bulk_reject_pending(ARRAY[p_pending_id], p_reason);
END;
$$;

COMMIT;
