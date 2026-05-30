-- ========================================================
-- FIX NEWS FEED JOIN DUPLICATIONS
-- ========================================================

-- 1. Fix get_news_feed duplicate items by joining on is_primary = true
CREATE OR REPLACE FUNCTION public.get_news_feed(p_email text)
 RETURNS TABLE(id uuid, caption text, image_url text, created_at timestamp with time zone, user_email text, first_name text, college_name text, profile_photo text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    n.id,
    n.caption,
    n.image_url,
    n.created_at,
    n.user_email,
    p.first_name,
    p.college,
    up.photo_url as profile_photo
  from news_posts n
  left join profiles p
    on p.email = n.user_email
  left join user_photos up
    on up.user_email = n.user_email and up.is_primary = true
  where n.status = 'approved'
  order by n.created_at desc;
$function$;

-- 2. Fix get_news_feed_college duplicate items by joining on is_primary = true
CREATE OR REPLACE FUNCTION public.get_news_feed_college(p_email text)
 RETURNS TABLE(id uuid, caption text, image_url text, created_at timestamp with time zone, user_email text, first_name text, college text, profile_photo text, scope text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$DECLARE
  v_college text;
BEGIN
  -- Get the current user's college
  SELECT p.college
  INTO v_college
  FROM profiles p
  WHERE p.email = p_email;

  -- Return approved college-specific news
  RETURN QUERY
  SELECT
    n.id,
    n.caption,
    n.image_url,
    n.created_at,
    n.user_email,
    p.first_name,
    p.college,
    up.photo_url AS profile_photo,
    n.scope
  FROM news_posts n
  LEFT JOIN profiles p
    ON p.email = n.user_email
  LEFT JOIN user_photos up
    ON up.user_email = n.user_email AND up.is_primary = true
  WHERE
    n.status = 'approved'
    AND n.scope = 'college'
    AND p.college = v_college
  ORDER BY n.created_at DESC
  LIMIT 15;
END;$function$;

-- 3. Fix get_news_feed_global duplicate items by joining on is_primary = true
CREATE OR REPLACE FUNCTION public.get_news_feed_global(p_email text)
 RETURNS TABLE(id uuid, caption text, image_url text, created_at timestamp with time zone, user_email text, first_name text, college text, profile_photo text, scope text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$BEGIN
  RETURN QUERY
  SELECT
    n.id,
    n.caption,
    n.image_url,
    n.created_at,
    n.user_email,
    p.first_name,
    p.college,
    up.photo_url AS profile_photo,
    n.scope
  FROM news_posts n
  LEFT JOIN profiles p
    ON p.email = n.user_email
  LEFT JOIN user_photos up
    ON up.user_email = n.user_email AND up.is_primary = true
  WHERE
    n.status = 'approved'
    AND n.scope = 'global'
  ORDER BY n.created_at DESC
  LIMIT 15;
END;$function$;

-- 4. Fix get_pending_news_for_admin duplicate items by joining on is_primary = true
CREATE OR REPLACE FUNCTION public.get_pending_news_for_admin()
 RETURNS TABLE(id uuid, caption text, image_url text, created_at timestamp with time zone, user_email text, scope text, first_name text, college_name text, profile_photo text)
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  select
    n.id,
    n.caption,
    n.image_url,
    n.created_at,
    n.user_email,
    n.scope,
    p.first_name,
    p.college,
    up.photo_url as profile_photo
  from news_posts n
  left join profiles p
    on lower(trim(p.email)) = lower(trim(n.user_email))
  left join user_photos up
    on lower(trim(up.user_email)) = lower(trim(n.user_email)) AND up.is_primary = true
  where n.status = 'pending'
  order by n.created_at desc;
$function$;
