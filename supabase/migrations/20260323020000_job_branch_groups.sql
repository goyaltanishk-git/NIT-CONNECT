BEGIN;

CREATE TABLE IF NOT EXISTS public.job_branch_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_by_email text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.job_branch_group_members (
  group_id uuid NOT NULL REFERENCES public.job_branch_groups(id) ON DELETE CASCADE,
  branch text NOT NULL,
  PRIMARY KEY (group_id, branch)
);

CREATE INDEX IF NOT EXISTS idx_job_branch_group_members_branch
  ON public.job_branch_group_members (branch);

ALTER TABLE public.job_branch_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_branch_group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "job_branch_groups_no_direct_access" ON public.job_branch_groups;
DROP POLICY IF EXISTS "job_branch_group_members_no_direct_access" ON public.job_branch_group_members;

CREATE POLICY "job_branch_groups_no_direct_access"
ON public.job_branch_groups
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "job_branch_group_members_no_direct_access"
ON public.job_branch_group_members
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

REVOKE ALL ON TABLE public.job_branch_groups FROM anon, authenticated;
REVOKE ALL ON TABLE public.job_branch_group_members FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.jobs_get_branch_catalog()
RETURNS TABLE (branch text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT trim(p.branch) AS branch
  FROM public.profiles p
  WHERE p.branch IS NOT NULL
    AND trim(p.branch) <> ''
  ORDER BY 1;
$$;

CREATE OR REPLACE FUNCTION public.jobs_get_saved_target_groups()
RETURNS TABLE (
  group_id uuid,
  group_name text,
  branches text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    g.id AS group_id,
    g.name AS group_name,
    COALESCE(array_agg(m.branch ORDER BY m.branch), '{}'::text[]) AS branches
  FROM public.job_branch_groups g
  LEFT JOIN public.job_branch_group_members m
    ON m.group_id = g.id
  WHERE g.is_active = true
  GROUP BY g.id, g.name
  ORDER BY lower(g.name);
$$;

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
  v_email := lower(nullif(current_setting('app.current_user_email', true), ''));
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'SESSION_EMAIL_MISSING';
  END IF;

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

  DELETE FROM public.job_branch_group_members
  WHERE group_id = v_group_id;

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

GRANT EXECUTE ON FUNCTION public.jobs_get_branch_catalog() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.jobs_get_saved_target_groups() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.jobs_create_target_group(text, text[]) TO anon, authenticated;

COMMIT;
