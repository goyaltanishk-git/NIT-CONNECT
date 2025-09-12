// src/lib/supabase-services.ts
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/types/generated'

/** Table type aliases **/
type ProfileRow      = Database['public']['Tables']['profiles']['Row']
type ProfileInsert   = Database['public']['Tables']['profiles']['Insert']
type ProfileUpdate   = Database['public']['Tables']['profiles']['Update']

type DailyLimitRow   = Database['public']['Tables']['daily_limits']['Row']
type DailyLimitInsert= Database['public']['Tables']['daily_limits']['Insert']
type DailyLimitUpdate= Database['public']['Tables']['daily_limits']['Update']

type EloRatingRow    = Database['public']['Tables']['elo_ratings']['Row']
type EloRatingInsert = Database['public']['Tables']['elo_ratings']['Insert']
type EloRatingUpdate = Database['public']['Tables']['elo_ratings']['Update']

type EmailOtpRow     = Database['public']['Tables']['email_otps']['Row']
type EmailOtpInsert  = Database['public']['Tables']['email_otps']['Insert']
type EmailOtpUpdate  = Database['public']['Tables']['email_otps']['Update']

type MatchRow        = Database['public']['Tables']['matches']['Row']
type MatchInsert     = Database['public']['Tables']['matches']['Insert']
type MatchUpdate     = Database['public']['Tables']['matches']['Update']

type MessageRow      = Database['public']['Tables']['messages']['Row']
type MessageInsert   = Database['public']['Tables']['messages']['Insert']
type MessageUpdate   = Database['public']['Tables']['messages']['Update']

type ReportRow       = Database['public']['Tables']['reports']['Row']
type ReportInsert    = Database['public']['Tables']['reports']['Insert']
type ReportUpdate    = Database['public']['Tables']['reports']['Update']

type InteractionRow  = Database['public']['Tables']['user_interactions']['Row']
type InteractionInsert= Database['public']['Tables']['user_interactions']['Insert']
type InteractionUpdate= Database['public']['Tables']['user_interactions']['Update']

type InterestRow     = Database['public']['Tables']['user_interests']['Row']
type InterestInsert  = Database['public']['Tables']['user_interests']['Insert']
type InterestUpdate  = Database['public']['Tables']['user_interests']['Update']

type PhotoRow        = Database['public']['Tables']['user_photos']['Row']
type PhotoInsert     = Database['public']['Tables']['user_photos']['Insert']
type PhotoUpdate     = Database['public']['Tables']['user_photos']['Update']

type PromptRow       = Database['public']['Tables']['user_prompts']['Row']
type PromptInsert    = Database['public']['Tables']['user_prompts']['Insert']
type PromptUpdate    = Database['public']['Tables']['user_prompts']['Update']

/** Profiles **/
export async function createProfile(data: ProfileInsert): Promise<ProfileRow> {
  const { data: row, error } = await supabase
    .from('profiles')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return row
}

export async function updateProfile(user_id: string, updates: ProfileUpdate): Promise<ProfileRow> {
  const { data: row, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', user_id)
    .select()
    .single()
  if (error) throw error
  return row
}

/** Daily Limits **/
export async function getDailyLimit(user_id: string, date: string): Promise<DailyLimitRow> {
  const { data: row, error } = await supabase
    .from('daily_limits')
    .select()
    .eq('user_id', user_id)
    .eq('date', date)
    .single()
  if (error) throw error
  return row
}

export async function upsertDailyLimit(data: DailyLimitInsert): Promise<DailyLimitRow> {
  const { data: row, error } = await supabase
    .from('daily_limits')
    .upsert(data)
    .select()
    .single()
  if (error) throw error
  return row
}

/** ELO Ratings **/
export async function getEloRating(user_id: string): Promise<EloRatingRow> {
  const { data: row, error } = await supabase
    .from('elo_ratings')
    .select()
    .eq('user_id', user_id)
    .single()
  if (error) throw error
  return row
}

export async function updateEloRating(user_id: string, updates: EloRatingUpdate): Promise<EloRatingRow> {
  const { data: row, error } = await supabase
    .from('elo_ratings')
    .update(updates)
    .eq('user_id', user_id)
    .select()
    .single()
  if (error) throw error
  return row
}

/** Email OTPs **/
export async function createEmailOtp(data: EmailOtpInsert): Promise<EmailOtpRow> {
  const { data: row, error } = await supabase
    .from('email_otps')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return row
}

export async function verifyEmailOtp(id: string, updates: EmailOtpUpdate): Promise<EmailOtpRow> {
  const { data: row, error } = await supabase
    .from('email_otps')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return row
}

/** Matches **/
export async function createMatch(data: MatchInsert): Promise<MatchRow> {
  const { data: row, error } = await supabase
    .from('matches')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return row
}

export async function updateMatch(id: string, updates: MatchUpdate): Promise<MatchRow> {
  const { data: row, error } = await supabase
    .from('matches')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return row
}

/** Messages **/
export async function sendMessage(data: MessageInsert): Promise<MessageRow> {
  const { data: row, error } = await supabase
    .from('messages')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return row
}

export async function updateMessage(id: string, updates: MessageUpdate): Promise<MessageRow> {
  const { data: row, error } = await supabase
    .from('messages')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return row
}

/** Reports **/
export async function createReport(data: ReportInsert): Promise<ReportRow> {
  const { data: row, error } = await supabase
    .from('reports')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return row
}

/** User Interactions **/
export async function recordInteraction(data: InteractionInsert): Promise<InteractionRow> {
  const { data: row, error } = await supabase
    .from('user_interactions')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return row
}

/** Interests **/
export async function addInterest(data: InterestInsert): Promise<InterestRow> {
  const { data: row, error } = await supabase
    .from('user_interests')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return row
}

/** Photos **/
export async function addUserPhoto(data: PhotoInsert): Promise<PhotoRow> {
  const { data: row, error } = await supabase
    .from('user_photos')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return row
}

export async function updateUserPhoto(id: string, updates: PhotoUpdate): Promise<PhotoRow> {
  const { data: row, error } = await supabase
    .from('user_photos')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return row
}

/** Prompts **/
export async function addUserPrompt(data: PromptInsert): Promise<PromptRow> {
  const { data: row, error } = await supabase
    .from('user_prompts')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return row
}

export async function updateUserPrompt(id: string, updates: PromptUpdate): Promise<PromptRow> {
  const { data: row, error } = await supabase
    .from('user_prompts')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return row
}
