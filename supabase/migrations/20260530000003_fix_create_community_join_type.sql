-- Migration: Fix create_community RPC function join type validation to match table constraints
-- Replaces validation check for 'private' with 'approval'

CREATE OR REPLACE FUNCTION public.create_community(
  p_name text,
  p_description text,
  p_image_url text,
  p_join_type text,
  p_email text
)
RETURNS text
LANGUAGE plpgsql
AS $function$
DECLARE
  v_count INT;
BEGIN

  PERFORM set_config('app.user_email', p_email, true);

  SELECT COUNT(*) INTO v_count
  FROM communities
  WHERE LOWER(TRIM(created_by)) = LOWER(TRIM(p_email));

  IF v_count >= 2 THEN
    RETURN 'LIMIT_REACHED';
  END IF;

  IF p_name IS NULL OR TRIM(p_name) = '' THEN
    RETURN 'INVALID_NAME';
  END IF;

  -- Fix: Match communities_join_type_check constraint ('open', 'approval')
  IF p_join_type NOT IN ('open', 'approval') THEN
    RETURN 'INVALID_JOIN_TYPE';
  END IF;

  IF EXISTS (
    SELECT 1 FROM communities
    WHERE LOWER(name) = LOWER(p_name)
  ) THEN
    RETURN 'NAME_EXISTS';
  END IF;

  INSERT INTO communities (
    name,
    description,
    image_url,
    join_type,
    created_by
  )
  VALUES (
    p_name,
    p_description,
    p_image_url,
    p_join_type,
    p_email
  );

  RETURN 'CREATED';

END;
$function$;
