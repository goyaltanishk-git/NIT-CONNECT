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
  static async updateUserInterests(userEmail: string, interests: string[]): Promise<void> {
    try {

      // First, delete all existing interests for this user
      const { error: deleteError } = await supabase
        .from('user_interests')
        .delete()
        .eq('user_email', userEmail);

      if (deleteError) {
        throw deleteError;
      }

      // Then, insert new interests if any
      if (interests.length > 0) {
        const interestsToInsert = interests.map(interest => ({
          user_email: userEmail,
          interest: interest.trim()
        }));

        const { error: insertError } = await supabase
          .from('user_interests')
          .insert(interestsToInsert);

        if (insertError) {
          throw insertError;
        }
      }

    } catch (error) {
      throw error;
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