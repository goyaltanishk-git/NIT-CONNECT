-- Migration: make set_app_session_user set session-level config so subsequent RPCs see it
BEGIN;

CREATE OR REPLACE FUNCTION public.set_app_session_user(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- make this a session-level setting so other RPCs can read it via current_setting
  PERFORM set_config('app.current_user_email', user_email, true);
END;
$function$;

COMMIT;
