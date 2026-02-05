// @/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://qpscizfrbcceiwzqpwrv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwc2NpemZyYmNjZWl3enFwd3J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxODgwODYsImV4cCI6MjA3Mjc2NDA4Nn0.1ZzY7-oXzqIaLK5j4wRL7AzTaL4909jywd6E2SVGvkQ";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

/**
 * Syncs the frontend user email with the Postgres session variable.
 * This "unlocks" RLS policies for custom OTP flows where a standard JWT isn't used.
 */
export const syncAppSession = async (email: string | undefined) => {
  if (!email) return;
  // This string 'set_app_session_user' MUST match the SQL function name exactly
  const { error } = await supabase.rpc('set_app_session_user', { 
    user_email: email.toLowerCase() 
  });
  if (error) console.error("Handshake Error:", error);
};