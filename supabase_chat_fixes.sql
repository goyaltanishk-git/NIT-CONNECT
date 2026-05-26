-- ============================================================
-- CHAT BUG FIXES - Run this in Supabase SQL Editor
-- Fixes: BUG-162 (match check) + BUG-027 (mark as read)
-- ============================================================

-- BUG-162: send_chat_message now blocks messages between non-matched users
CREATE OR REPLACE FUNCTION public.send_chat_message(
  p_sender text,
  p_reciever text,
  p_content text,
  p_type text DEFAULT 'text'::text,
  p_attachment_url text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_inserted_message JSONB;
BEGIN
  PERFORM set_config('app.user_email', p_sender, true);

  -- Verify an active match exists between sender and receiver
  IF NOT EXISTS (
    SELECT 1 FROM matches
    WHERE is_active = true
      AND (
        (user1_id = p_sender AND user2_id = p_reciever)
        OR
        (user1_id = p_reciever AND user2_id = p_sender)
      )
  ) THEN
    RAISE EXCEPTION 'NO_ACTIVE_MATCH';
  END IF;

  INSERT INTO messages (sender, reciever, content, type, attachment_url, is_read)
  VALUES (p_sender, p_reciever, p_content, p_type, p_attachment_url, false)
  RETURNING to_jsonb(messages.*) INTO v_inserted_message;

  RETURN v_inserted_message;
END;
$$;


-- BUG-027: get_chat_messages now marks messages as read in the same DB call
-- so unread counts sync correctly across all devices on refresh
CREATE OR REPLACE FUNCTION public.get_chat_messages(p_user_email text, p_target_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSONB;
BEGIN
  PERFORM set_config('app.user_email', p_user_email, true);

  -- Mark all unread messages from target to current user as read
  UPDATE messages
  SET is_read = true
  WHERE reciever = p_user_email
    AND sender   = p_target_email
    AND is_read  = false;

  -- Return all messages between both users, oldest first
  SELECT jsonb_agg(to_jsonb(msg) ORDER BY msg.created_at ASC)
  INTO result
  FROM messages msg
  WHERE (msg.sender = p_user_email AND msg.reciever = p_target_email)
     OR (msg.sender = p_target_email AND msg.reciever = p_user_email);

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;
