-- ==========================================
-- UPDATE complete_profile_setup RPC TO AUTO-FILL BATCH IF NULL
-- ==========================================

CREATE OR REPLACE FUNCTION public.complete_profile_setup(p_email text, p_profile_updates jsonb, p_photos jsonb, p_interests text[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_profile_record public.profiles;
  v_year_of_study text;
  v_grad_batch int;
BEGIN
  -- 1. Fetch existing profile fields
  SELECT year_of_study, graduation_batch INTO v_year_of_study, v_grad_batch FROM public.profiles WHERE email = p_email;

  -- 2. If graduation_batch is null, calculate B.Tech graduation year based on year_of_study
  IF v_grad_batch IS NULL AND v_year_of_study IS NOT NULL THEN
    DECLARE
      v_normalized text := lower(trim(v_year_of_study));
    BEGIN
      IF v_normalized LIKE '%3rd%' OR v_normalized = '3' THEN
        v_grad_batch := 2027;
      ELSIF v_normalized LIKE '%2nd%' OR v_normalized = '2' THEN
        v_grad_batch := 2028;
      ELSIF v_normalized LIKE '%1st%' OR v_normalized = '1' THEN
        v_grad_batch := 2029;
      ELSIF v_normalized LIKE '%4th%' OR v_normalized = '4' THEN
        v_grad_batch := 2026;
      END IF;
    END;
  END IF;

  -- 3. Update Profile (including graduation_batch if it was null)
  UPDATE public.profiles
  SET
    date_of_birth = (p_profile_updates->>'date_of_birth')::date,
    bio = p_profile_updates->>'bio',
    height = (p_profile_updates->>'height')::int,
    hometown = p_profile_updates->>'hometown',
    phone_number = p_profile_updates->>'phone_number',
    instagram_handle = p_profile_updates->>'instagram_handle',
    is_active = true,
    verification_status = 'verified',
    graduation_batch = COALESCE(graduation_batch, v_grad_batch),
    updated_at = now()
  WHERE email = p_email
  RETURNING * INTO v_profile_record;

  -- 4. Handle Photos
  DELETE FROM public.user_photos WHERE user_email = p_email;
  IF jsonb_array_length(p_photos) > 0 THEN
    INSERT INTO public.user_photos (user_email, photo_url, photo_order, is_primary)
    SELECT p_email, (x->>'photo_url'), (x->>'photo_order')::int, (x->>'is_primary')::boolean
    FROM jsonb_array_elements(p_photos) t(x);
  END IF;

  -- 5. Handle Interests
  DELETE FROM public.user_interests WHERE user_email = p_email;
  IF array_length(p_interests, 1) > 0 THEN
    INSERT INTO public.user_interests (user_email, interest)
    SELECT p_email, i FROM unnest(p_interests) i;
  END IF;

  RETURN to_jsonb(v_profile_record);
END;
$function$;
