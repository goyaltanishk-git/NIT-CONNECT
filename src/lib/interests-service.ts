import { supabase } from '@/integrations/supabase/client';

export interface UserInterest {
  user_email: string;
  interest: string;
  created_at: string;
}

export class InterestsService {
  // Get all interests for a user
  static async getUserInterests(userEmail: string): Promise<string[]> {
    try {
      
      const { data, error } = await supabase
        .from('user_interests')
        .select('interest')
        .eq('user_email', userEmail)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      const interests = (data || []).map((row: any) => row.interest);
      return interests;
    } catch (error) {
      throw error;
    }
  }

  // Update all interests for a user (replace existing)
  // Inside interests-service.ts
// Inside InterestsService.ts
static async updateUserInterests(email: string, interests: string[]) {
  // 1. Delete all current interests for this user
  await supabase
    .from('user_interests')
    .delete()
    .eq('user_email', email);

  // 2. Insert the new list
  if (interests.length > 0) {
    const { error } = await supabase
      .from('user_interests')
      .insert(interests.map(i => ({ user_email: email, interest: i })));
    
    if (error) throw error;
  }
}

  // Add a single interest
  static async addInterest(userEmail: string, interest: string): Promise<void> {
    try {

      const { error } = await supabase
        .from('user_interests')
        .insert({
          user_email: userEmail,
          interest: interest.trim()
        });

      if (error) {
        throw error;
      }

    } catch (error) {
      throw error;
    }
  }

  // Remove a single interest
  static async removeInterest(userEmail: string, interest: string): Promise<void> {
    try {

      const { error } = await supabase
        .from('user_interests')
        .delete()
        .eq('user_email', userEmail)
        .eq('interest', interest);

      if (error) {
        throw error;
      }

    } catch (error) {
      throw error;
    }
  }
}