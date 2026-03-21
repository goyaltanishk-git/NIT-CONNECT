-- RPC functions for discovery fetch and dating mode cleanup.

CREATE OR REPLACE FUNCTION public.get_discovery_profiles_v2(
  p_email text,
  p_offset integer DEFAULT 0,
  p_limit integer DEFAULT 10
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_college text;
  v_interested_in public.gender_type;
  v_gender public.gender_type;
  v_result jsonb;
BEGIN
  SELECT college, interested_in, gender
  INTO v_college, v_interested_in, v_gender
  FROM public.profiles
  WHERE email = p_email;

  IF v_college IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  WITH candidates AS (
    SELECT p.*
    FROM public.profiles p
    WHERE p.college = v_college
      AND p.gender = v_interested_in
      AND p.interested_in = v_gender
      AND p.is_active = true
      AND p.is_verified = true
      AND p.is_dating = true
      AND p.email <> p_email
      AND NOT EXISTS (
        SELECT 1
        FROM public.user_interactions ui
        WHERE (ui.user_id = p_email AND ui.target_user_id = p.email)
           OR (ui.user_id = p.email AND ui.target_user_id = p_email)
      )
    ORDER BY COALESCE(p.shuffle_order, 2147483647), p.updated_at DESC NULLS LAST
    LIMIT p_limit
    OFFSET p_offset
  )
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(c) || jsonb_build_object(
        'age', EXTRACT(YEAR FROM age(current_date, c.date_of_birth))::int,
        'photos', (
          SELECT COALESCE(
            jsonb_agg(
              jsonb_build_object('url', ph.photo_url, 'order', ph.photo_order)
              ORDER BY ph.photo_order
            ),
            '[]'::jsonb
          )
          FROM public.user_photos ph
          WHERE ph.user_email = c.email
        ),
        'interests', (
          SELECT COALESCE(jsonb_agg(i.interest), '[]'::jsonb)
          FROM public.user_interests i
          WHERE i.user_email = c.email
        )
      )
    ),
    '[]'::jsonb
  )
  INTO v_result
  FROM candidates c;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_global_profiles_v2(
  p_email text,
  p_offset integer DEFAULT 0,
  p_limit integer DEFAULT 10,
  p_selected_colleges text[] DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_interested_in public.gender_type;
  v_gender public.gender_type;
  v_result jsonb;
BEGIN
  SELECT interested_in, gender
  INTO v_interested_in, v_gender
  FROM public.profiles
  WHERE email = p_email;

  IF v_interested_in IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  WITH candidates AS (
    SELECT p.*
    FROM public.profiles p
    WHERE p.gender = v_interested_in
      AND p.interested_in = v_gender
      AND p.is_active = true
      AND p.is_verified = true
      AND p.is_dating = true
      AND p.email <> p_email
      AND (
        p_selected_colleges IS NULL
        OR cardinality(p_selected_colleges) = 0
        OR p.college = ANY(p_selected_colleges)
      )
      AND NOT EXISTS (
        SELECT 1
        FROM public.user_interactions ui
        WHERE (ui.user_id = p_email AND ui.target_user_id = p.email)
           OR (ui.user_id = p.email AND ui.target_user_id = p_email)
      )
    ORDER BY COALESCE(p.shuffle_order, 2147483647), p.updated_at DESC NULLS LAST
    LIMIT p_limit
    OFFSET p_offset
  )
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(c) || jsonb_build_object(
        'age', EXTRACT(YEAR FROM age(current_date, c.date_of_birth))::int,
        'photos', (
          SELECT COALESCE(
            jsonb_agg(
              jsonb_build_object('url', ph.photo_url, 'order', ph.photo_order)
              ORDER BY ph.photo_order
            ),
            '[]'::jsonb
          )
          FROM public.user_photos ph
          WHERE ph.user_email = c.email
        ),
        'interests', (
          SELECT COALESCE(jsonb_agg(i.interest), '[]'::jsonb)
          FROM public.user_interests i
          WHERE i.user_email = c.email
        )
      )
    ),
    '[]'::jsonb
  )
  INTO v_result
  FROM candidates c;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.leave_dating_mode(
  p_email text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_interactions integer := 0;
  v_deleted_messages integer := 0;
  v_deleted_matches integer := 0;
BEGIN
  UPDATE public.profiles
  SET is_dating = false,
      updated_at = now()
  WHERE email = p_email;

  DELETE FROM public.user_interactions
  WHERE user_id = p_email
     OR target_user_id = p_email;
  GET DIAGNOSTICS v_deleted_interactions = ROW_COUNT;

  DELETE FROM public.messages
  WHERE sender = p_email
     OR reciever = p_email;
  GET DIAGNOSTICS v_deleted_messages = ROW_COUNT;

  DELETE FROM public.matches
  WHERE user1_id = p_email
     OR user2_id = p_email;
  GET DIAGNOSTICS v_deleted_matches = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'deleted_interactions', v_deleted_interactions,
    'deleted_messages', v_deleted_messages,
    'deleted_matches', v_deleted_matches
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_discovery_profiles_v2(text, integer, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_global_profiles_v2(text, integer, integer, text[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.leave_dating_mode(text) TO anon, authenticated;
