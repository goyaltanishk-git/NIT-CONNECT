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
      console.log('🎯 Fetching interests for:', userEmail);
      
      const { data, error } = await supabase
        .from('user_interests')
        .select('interest')
        .eq('user_email', userEmail)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error fetching interests:', error);
        throw error;
      }

      const interests = (data || []).map((row: any) => row.interest);
      console.log(`✅ Found ${interests.length} interests for ${userEmail}:`, interests);
      return interests;
    } catch (error) {
      console.error('❌ Failed to fetch interests:', error);
      throw error;
    }
  }

  // Update all interests for a user (replace existing)
  static async updateUserInterests(userEmail: string, interests: string[]): Promise<void> {
    try {
      console.log('🎯 Updating interests for:', userEmail, 'with:', interests);

      // First, delete all existing interests for this user
      const { error: deleteError } = await supabase
        .from('user_interests')
        .delete()
        .eq('user_email', userEmail);

      if (deleteError) {
        console.error('❌ Error deleting existing interests:', deleteError);
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
          console.error('❌ Error inserting new interests:', insertError);
          throw insertError;
        }
      }

      console.log('✅ Successfully updated interests for:', userEmail);
    } catch (error) {
      console.error('❌ Failed to update interests:', error);
      throw error;
    }
  }

  // Add a single interest
  static async addInterest(userEmail: string, interest: string): Promise<void> {
    try {
      console.log('🎯 Adding interest:', interest, 'for:', userEmail);

      const { error } = await supabase
        .from('user_interests')
        .insert({
          user_email: userEmail,
          interest: interest.trim()
        });

      if (error) {
        console.error('❌ Error adding interest:', error);
        throw error;
      }

      console.log('✅ Successfully added interest:', interest);
    } catch (error) {
      console.error('❌ Failed to add interest:', error);
      throw error;
    }
  }

  // Remove a single interest
  static async removeInterest(userEmail: string, interest: string): Promise<void> {
    try {
      console.log('🎯 Removing interest:', interest, 'for:', userEmail);

      const { error } = await supabase
        .from('user_interests')
        .delete()
        .eq('user_email', userEmail)
        .eq('interest', interest);

      if (error) {
        console.error('❌ Error removing interest:', error);
        throw error;
      }

      console.log('✅ Successfully removed interest:', interest);
    } catch (error) {
      console.error('❌ Failed to remove interest:', error);
      throw error;
    }
  }
}