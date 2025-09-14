// src/hooks/useUserProfile.ts

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AuthService, Profile, ProfileUpdate } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';

// 1. Define a new type that includes the 'photos' array.
// This represents the complete profile object for the UI.
export type FullProfile = Profile & {
  photos: string[];
};

export function useUserProfile() {
  // 2. Use the new 'FullProfile' type for the component's state.
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        setLoading(false);
        return;
      }
      
      // Step A: Fetch the main profile data from the 'profiles' table.
      const userProfile = await AuthService.getUserProfile(user.email);

      if (userProfile) {
        // Step B: If a profile exists, fetch the associated photos from the 'user_photos' table.
        const { data: photosData, error: photosError } = await supabase
          .from('user_photos')
          .select('photo_url')
          .eq('user_id', userProfile.user_id)
          .order('photo_order', { ascending: true });

        if (photosError) {
          console.error("Error fetching user photos:", photosError);
        }

        // Step C: Combine the profile data and photos into a single 'FullProfile' object.
        const fullProfile: FullProfile = {
          ...userProfile,
          photos: photosData?.map(p => p.photo_url) || [], // Create the photos array
        };
        
        setProfile(fullProfile);
      }
      
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // The updateProfile function remains the same, as it only needs to update the 'profiles' table.
  // Photo management would require a separate function.
  const updateProfile = useCallback(async (updates: ProfileUpdate) => {
    if (!profile?.email) {
      toast({ title: 'Error', description: 'Cannot update profile, user not found.', variant: 'destructive' });
      return;
    }
    
    setLoading(true);
    try {
      await AuthService.updateProfile(profile.email, updates);
      // Refetch the full profile to get the latest data including photos
      await fetchProfile(); 
      toast({
        title: 'Profile Updated!',
        description: 'Your changes have been saved successfully.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Update Failed',
        description: 'Could not save your changes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [profile, toast, fetchProfile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, updateProfile, refetch: fetchProfile };
}