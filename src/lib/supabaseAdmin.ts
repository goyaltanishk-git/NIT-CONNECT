// Server-side admin access is handled directly in server/api/*.js files.
// Each handler calls createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
// in Node.js where those env vars are safe. This file must NEVER be imported by frontend code.
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

if (typeof window !== 'undefined') {
  throw new Error(
    '[supabaseAdmin] Imported in browser context. ' +
    'Service role key must never reach the client. ' +
    'Use the public supabase client from @/integrations/supabase/client instead.'
  );
}

export const supabaseAdmin = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
