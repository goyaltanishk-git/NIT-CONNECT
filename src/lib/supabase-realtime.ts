import { supabase } from '@/integrations/supabase/client'
import { Database } from '@/types/generated'

/** Table type aliases **/
type ProfileRow = Database['public']['Tables']['profiles']['Row']
type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
type UserPhotoRow = Database['public']['Tables']['user_photos']['Row']
type UserPhotoInsert = Database['public']['Tables']['user_photos']['Insert']
type UserPhotoUpdate = Database['public']['Tables']['user_photos']['Update']
type UserInterestRow = Database['public']['Tables']['user_interests']['Row']
type UserInterestInsert = Database['public']['Tables']['user_interests']['Insert']
type UserInterestUpdate = Database['public']['Tables']['user_interests']['Update']
type UserPromptRow = Database['public']['Tables']['user_prompts']['Row']
type UserPromptInsert = Database['public']['Tables']['user_prompts']['Insert']
type UserPromptUpdate = Database['public']['Tables']['user_prompts']['Update']
type MessageRow = Database['public']['Tables']['messages']['Row']
type MessageInsert = Database['public']['Tables']['messages']['Insert']
type MessageUpdate = Database['public']['Tables']['messages']['Update']
type MatchRow = Database['public']['Tables']['matches']['Row']
type MatchInsert = Database['public']['Tables']['matches']['Insert']
type MatchUpdate = Database['public']['Tables']['matches']['Update']
type UserInteractionRow = Database['public']['Tables']['user_interactions']['Row']
type UserInteractionInsert = Database['public']['Tables']['user_interactions']['Insert']
type UserInteractionUpdate = Database['public']['Tables']['user_interactions']['Update']
type EloRatingRow = Database['public']['Tables']['elo_ratings']['Row']
type EloRatingInsert = Database['public']['Tables']['elo_ratings']['Insert']
type EloRatingUpdate = Database['public']['Tables']['elo_ratings']['Update']
type DailyLimitRow = Database['public']['Tables']['daily_limits']['Row']
type DailyLimitInsert = Database['public']['Tables']['daily_limits']['Insert']
type DailyLimitUpdate = Database['public']['Tables']['daily_limits']['Update']
type ReportRow = Database['public']['Tables']['reports']['Row']
type ReportInsert = Database['public']['Tables']['reports']['Insert']
type ReportUpdate = Database['public']['Tables']['reports']['Update']

export class SupabaseRealtime {
  /** Profiles realtime **/
  onProfileInsert(callback: (newRow: ProfileRow) => void) {
    return supabase
      .channel('profiles-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, payload => callback(payload.new as ProfileRow))
      .subscribe();
  }

  onProfileUpdate(callback: (newRow: ProfileRow) => void) {
    return supabase
      .channel('profiles-channel')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, payload => callback(payload.new as ProfileRow))
      .subscribe();
  }

  onProfileDelete(callback: (oldRow: ProfileRow) => void) {
    return supabase
      .channel('profiles-channel')
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'profiles' }, payload => callback(payload.old as ProfileRow))
      .subscribe();
  }

  /** Profiles CRUD **/
  async createProfile(profile: ProfileInsert): Promise<ProfileRow> {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profile)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async updateProfile(userId: string, updates: ProfileUpdate): Promise<ProfileRow> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  }

  /** User Photos realtime **/
  onUserPhotoInsert(callback: (newRow: UserPhotoRow) => void) {
    return supabase
      .channel('user_photos-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_photos' }, payload => callback(payload.new as UserPhotoRow))
      .subscribe();
  }

  onUserPhotoUpdate(callback: (newRow: UserPhotoRow) => void) {
    return supabase
      .channel('user_photos-channel')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'user_photos' }, payload => callback(payload.new as UserPhotoRow))
      .subscribe();
  }

  onUserPhotoDelete(callback: (oldRow: UserPhotoRow) => void) {
    return supabase
      .channel('user_photos-channel')
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'user_photos' }, payload => callback(payload.old as UserPhotoRow))
      .subscribe();
  }

  /** User Photos CRUD **/
  async createUserPhoto(photo: UserPhotoInsert): Promise<UserPhotoRow> {
    const { data, error } = await supabase
      .from('user_photos')
      .insert(photo)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async updateUserPhoto(photoId: string, updates: UserPhotoUpdate): Promise<UserPhotoRow> {
    const { data, error } = await supabase
      .from('user_photos')
      .update(updates)
      .eq('id', photoId)
      .select()
      .single()
    if (error) throw error
    return data
  }
  
  async deleteUserPhoto(photoId: string): Promise<void> {
    const { error } = await supabase
      .from('user_photos')
      .delete()
      .eq('id', photoId);
    if (error) throw error;
  }

  /** User Interests realtime **/
  onUserInterestInsert(callback: (newRow: UserInterestRow) => void) {
    return supabase
      .channel('user_interests-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_interests' }, payload => callback(payload.new as UserInterestRow))
      .subscribe();
  }

  onUserInterestUpdate(callback: (newRow: UserInterestRow) => void) {
    return supabase
      .channel('user_interests-channel')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'user_interests' }, payload => callback(payload.new as UserInterestRow))
      .subscribe();
  }

  onUserInterestDelete(callback: (oldRow: UserInterestRow) => void) {
    return supabase
      .channel('user_interests-channel')
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'user_interests' }, payload => callback(payload.old as UserInterestRow))
      .subscribe();
  }
  
  /** User Interests CRUD **/
  async createUserInterest(interest: UserInterestInsert): Promise<UserInterestRow> {
    const { data, error } = await supabase
      .from('user_interests')
      .insert(interest)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async deleteUserInterest(interestId: string): Promise<void> {
    const { error } = await supabase
      .from('user_interests')
      .delete()
      .eq('id', interestId);
    if (error) throw error;
  }

  /** User Prompts realtime **/
  onUserPromptInsert(callback: (newRow: UserPromptRow) => void) {
    return supabase
      .channel('user_prompts-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_prompts' }, payload => callback(payload.new as UserPromptRow))
      .subscribe();
  }

  onUserPromptUpdate(callback: (newRow: UserPromptRow) => void) {
    return supabase
      .channel('user_prompts-channel')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'user_prompts' }, payload => callback(payload.new as UserPromptRow))
      .subscribe();
  }

  onUserPromptDelete(callback: (oldRow: UserPromptRow) => void) {
    return supabase
      .channel('user_prompts-channel')
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'user_prompts' }, payload => callback(payload.old as UserPromptRow))
      .subscribe();
  }

  /** User Prompts CRUD **/
  async createUserPrompt(prompt: UserPromptInsert): Promise<UserPromptRow> {
    const { data, error } = await supabase
      .from('user_prompts')
      .insert(prompt)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async updateUserPrompt(promptId: string, updates: UserPromptUpdate): Promise<UserPromptRow> {
    const { data, error } = await supabase
      .from('user_prompts')
      .update(updates)
      .eq('id', promptId)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async deleteUserPrompt(promptId: string): Promise<void> {
    const { error } = await supabase
      .from('user_prompts')
      .delete()
      .eq('id', promptId);
    if (error) throw error;
  }

  /** Messages realtime by match_id **/
  onMessageInsert(matchId: string, callback: (newMsg: MessageRow) => void) {
    return supabase
      .channel(`messages-match-${matchId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` }, payload => callback(payload.new as MessageRow))
      .subscribe();
  }

  onMessageUpdate(matchId: string, callback: (newMsg: MessageRow) => void) {
    return supabase
      .channel(`messages-match-${matchId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` }, payload => callback(payload.new as MessageRow))
      .subscribe();
  }

  onMessageDelete(matchId: string, callback: (oldMsg: MessageRow) => void) {
    return supabase
      .channel(`messages-match-${matchId}`)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` }, payload => callback(payload.old as MessageRow))
      .subscribe();
  }

  /** Messages CRUD **/
  async createMessage(message: MessageInsert): Promise<MessageRow> {
    const { data, error } = await supabase
      .from('messages')
      .insert(message)
      .select()
      .single()
    if (error) throw error
    return data
  }
  
  /** Matches realtime **/
  onMatchInsert(callback: (newRow: MatchRow) => void) {
    return supabase
      .channel('matches-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matches' }, payload => callback(payload.new as MatchRow))
      .subscribe();
  }

  onMatchUpdate(callback: (newRow: MatchRow) => void) {
    return supabase
      .channel('matches-channel')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches' }, payload => callback(payload.new as MatchRow))
      .subscribe();
  }

  onMatchDelete(callback: (oldRow: MatchRow) => void) {
    return supabase
      .channel('matches-channel')
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'matches' }, payload => callback(payload.old as MatchRow))
      .subscribe();
  }
  
  /** Matches CRUD **/
  async createMatch(match: MatchInsert): Promise<MatchRow> {
    const { data, error } = await supabase
      .from('matches')
      .insert(match)
      .select()
      .single()
    if (error) throw error
    return data
  }
  
  /** User Interactions realtime **/
  onUserInteractionInsert(callback: (newRow: UserInteractionRow) => void) {
    return supabase
      .channel('user_interactions-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_interactions' }, payload => callback(payload.new as UserInteractionRow))
      .subscribe();
  }

  onUserInteractionUpdate(callback: (newRow: UserInteractionRow) => void) {
    return supabase
      .channel('user_interactions-channel')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'user_interactions' }, payload => callback(payload.new as UserInteractionRow))
      .subscribe();
  }

  onUserInteractionDelete(callback: (oldRow: UserInteractionRow) => void) {
    return supabase
      .channel('user_interactions-channel')
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'user_interactions' }, payload => callback(payload.old as UserInteractionRow))
      .subscribe();
  }

  /** User Interactions CRUD **/
  async createUserInteraction(interaction: UserInteractionInsert): Promise<UserInteractionRow> {
    const { data, error } = await supabase
      .from('user_interactions')
      .insert(interaction)
      .select()
      .single()
    if (error) throw error
    return data
  }
  
  /** Elo Ratings realtime **/
  onEloRatingInsert(callback: (newRow: EloRatingRow) => void) {
    return supabase
      .channel('elo_ratings-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'elo_ratings' }, payload => callback(payload.new as EloRatingRow))
      .subscribe();
  }

  onEloRatingUpdate(callback: (newRow: EloRatingRow) => void) {
    return supabase
      .channel('elo_ratings-channel')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'elo_ratings' }, payload => callback(payload.new as EloRatingRow))
      .subscribe();
  }

  onEloRatingDelete(callback: (oldRow: EloRatingRow) => void) {
    return supabase
      .channel('elo_ratings-channel')
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'elo_ratings' }, payload => callback(payload.old as EloRatingRow))
      .subscribe();
  }

  /** Elo Ratings CRUD **/
  async createEloRating(eloRating: EloRatingInsert): Promise<EloRatingRow> {
    const { data, error } = await supabase
      .from('elo_ratings')
      .insert(eloRating)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async updateEloRating(userId: string, updates: EloRatingUpdate): Promise<EloRatingRow> {
    const { data, error } = await supabase
      .from('elo_ratings')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  }

  /** Daily Limits realtime **/
  onDailyLimitInsert(callback: (newRow: DailyLimitRow) => void) {
    return supabase
      .channel('daily_limits-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'daily_limits' }, payload => callback(payload.new as DailyLimitRow))
      .subscribe();
  }

  onDailyLimitUpdate(callback: (newRow: DailyLimitRow) => void) {
    return supabase
      .channel('daily_limits-channel')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'daily_limits' }, payload => callback(payload.new as DailyLimitRow))
      .subscribe();
  }

  onDailyLimitDelete(callback: (oldRow: DailyLimitRow) => void) {
    return supabase
      .channel('daily_limits-channel')
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'daily_limits' }, payload => callback(payload.old as DailyLimitRow))
      .subscribe();
  }

  /** Daily Limits CRUD **/
  async createDailyLimit(dailyLimit: DailyLimitInsert): Promise<DailyLimitRow> {
    const { data, error } = await supabase
      .from('daily_limits')
      .insert(dailyLimit)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async updateDailyLimit(userId: string, updates: DailyLimitUpdate): Promise<DailyLimitRow> {
    const { data, error } = await supabase
      .from('daily_limits')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  }
  
  /** Reports realtime **/
  onReportInsert(callback: (newRow: ReportRow) => void) {
    return supabase
      .channel('reports-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reports' }, payload => callback(payload.new as ReportRow))
      .subscribe();
  }

  onReportUpdate(callback: (newRow: ReportRow) => void) {
    return supabase
      .channel('reports-channel')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'reports' }, payload => callback(payload.new as ReportRow))
      .subscribe();
  }

  onReportDelete(callback: (oldRow: ReportRow) => void) {
    return supabase
      .channel('reports-channel')
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'reports' }, payload => callback(payload.old as ReportRow))
      .subscribe();
  }

  /** Reports CRUD **/
  async createReport(report: ReportInsert): Promise<ReportRow> {
    const { data, error } = await supabase
      .from('reports')
      .insert(report)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async updateReport(reportId: string, updates: ReportUpdate): Promise<ReportRow> {
    const { data, error } = await supabase
      .from('reports')
      .update(updates)
      .eq('id', reportId)
      .select()
      .single()
    if (error) throw error
    return data
  }
}

export const supabaseRealtime = new SupabaseRealtime();
