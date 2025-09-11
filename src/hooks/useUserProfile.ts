import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UserProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  bio: string | null;
  year_of_study: string | null;
  branch: string | null;
  hometown: string | null;
  height: number | null;
  date_of_birth: string;
  gender: string;
  interested_in: string;
  photos: string[];
  interests: string[];
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
        return;
      }

      if (profileData) {
        // Get photos separately
        const { data: photos } = await supabase
          .from('user_photos')
          .select('photo_url, photo_order')
          .eq('user_id', user.id)
          .order('photo_order');

        // Get interests separately
        const { data: interests } = await supabase
          .from('user_interests')
          .select('interest')
          .eq('user_id', user.id);

        const transformedProfile = {
          ...profileData,
          photos: photos?.map(photo => photo.photo_url) || [],
          interests: interests?.map(interest => interest.interest) || []
        };
        setProfile(transformedProfile);
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createProfile = useCallback(async (profileData: Partial<UserProfile>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Create profile
      const profileInsert = {
        user_id: user.id,
        email: user.email || profileData.email || '',
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        date_of_birth: profileData.date_of_birth || '',
        gender: (profileData.gender as 'male' | 'female') || 'male',
        interested_in: ((profileData.interested_in === 'everyone' ? 'female' : profileData.interested_in) as 'male' | 'female') || 'female',
        bio: profileData.bio,
        year_of_study: profileData.year_of_study,
        branch: profileData.branch,
        hometown: profileData.hometown,
        height: profileData.height
      };
      
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert(profileInsert)
        .select()
        .single();

      if (profileError) throw profileError;

      // Add photos
      if (profileData.photos && profileData.photos.length > 0) {
        const photoInserts = profileData.photos.map((photo, index) => ({
          user_id: user.id,
          photo_url: photo,
          photo_order: index + 1,
          is_primary: index === 0
        }));

        await supabase.from('user_photos').insert(photoInserts);
      }

      // Add interests
      if (profileData.interests && profileData.interests.length > 0) {
        const interestInserts = profileData.interests.map(interest => ({
          user_id: user.id,
          interest
        }));

        await supabase.from('user_interests').insert(interestInserts);
      }

      toast({
        title: "Profile created!",
        description: "Your profile has been created successfully."
      });

      await fetchProfile();
      return true;
    } catch (error) {
      console.error('Error creating profile:', error);
      toast({
        title: "Error",
        description: "Failed to create profile. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  }, [fetchProfile, toast]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !profile) return false;

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: updates.first_name,
          last_name: updates.last_name,
          bio: updates.bio,
          year_of_study: updates.year_of_study,
          branch: updates.branch,
          hometown: updates.hometown,
          height: updates.height,
          gender: (updates.gender as 'male' | 'female'),
          interested_in: ((updates.interested_in === 'everyone' ? 'female' : updates.interested_in) as 'male' | 'female')
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Update photos if provided
      if (updates.photos) {
        // Delete existing photos
        await supabase.from('user_photos').delete().eq('user_id', user.id);
        
        // Insert new photos
        if (updates.photos.length > 0) {
          const photoInserts = updates.photos.map((photo, index) => ({
            user_id: user.id,
            photo_url: photo,
            photo_order: index + 1,
            is_primary: index === 0
          }));
          await supabase.from('user_photos').insert(photoInserts);
        }
      }

      // Update interests if provided
      if (updates.interests) {
        // Delete existing interests
        await supabase.from('user_interests').delete().eq('user_id', user.id);
        
        // Insert new interests
        if (updates.interests.length > 0) {
          const interestInserts = updates.interests.map(interest => ({
            user_id: user.id,
            interest
          }));
          await supabase.from('user_interests').insert(interestInserts);
        }
      }

      toast({
        title: "Profile updated!",
        description: "Your changes have been saved."
      });

      await fetchProfile();
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  }, [profile, fetchProfile, toast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    fetchProfile,
    createProfile,
    updateProfile
  };
}