// pages/api/verify-otp.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin' // see note below
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

// Validate OTP, then exchange for real Supabase session
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { email, otp } = req.body
  if (!email || !otp) return res.status(400).json({ error: 'Missing email or otp' })

  // 1. Verify OTP exists and not expired
  const { data: records, error: otpError } = await supabaseAdmin
    .from<Database['public']['Tables']['email_otps']['Row']>('email_otps')
    .select('*')
    .eq('email', email)
    .eq('otp', otp)
    .order('created_at', { ascending: false })
    .limit(1)
  if (otpError) return res.status(500).json({ error: otpError.message })
  const record = records?.[0]
  if (!record || new Date(record.expires_at) < new Date()) {
    return res.status(401).json({ error: 'Invalid or expired OTP' })
  }

  // 2. Upsert user by email
  const { data: user, error: userError } = await supabaseAdmin.auth.admin.upsertUser({
    email,
    email_confirm: true,
  })
  if (userError) return res.status(500).json({ error: userError.message })

  // 3. Create a session via service-role key
  const supabase = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: session, error: sessionError } = await supabase.auth.signInWithPassword({
    email,
    password: process.env.OTP_SIGNIN_SECRET! // set a constant secret in env
  })
  if (sessionError || !session.session) {
    return res.status(500).json({ error: sessionError?.message || 'Failed to create session' })
  }

  return res.status(200).json({
    access_token: session.session.access_token,
    refresh_token: session.session.refresh_token,
    user: session.session.user
  })
}
