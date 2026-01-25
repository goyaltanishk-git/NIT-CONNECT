import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AuthService, Profile, ProfileUpdate } from '@/lib/auth';
import { InterestsService } from '@/lib/interests-service';
import { supabase } from '@/integrations/supabase/client';
import {encryptedStorage} from '@/utils/encryptedStorage';

// Define a complete profile type that includes photos and interests
export type FullProfile = Profile & {
  photos: string[];
  interests: string[];
};

export function useUserProfile() {
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {

      // ✅ FIX #3: REMOVED REDUNDANT AUTH CHECK
      // The auth state is already managed by AuthGuard, no need to call supabase.auth.getUser() again
      // This eliminates 1 unnecessary auth query per profile fetch
      
      let userEmail: string | undefined;

      // Check localStorage directly
      var storedUser = encryptedStorage.get('current-user');
      const tempUser = localStorage.getItem('temp-user');

      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          userEmail = parsedUser.email;
        } catch (e) {
        }
      } else if (tempUser) {
        try {
          const parsedTempUser = JSON.parse(tempUser);
          userEmail = parsedTempUser.email;
        } catch (e) {
        }
      }

      if (!userEmail) {
        setLoading(false);
        return;
      }


      // Fetch the main profile data from Supabase
      const userProfile = await AuthService.getUserProfile(userEmail);

      if (userProfile) {

        // Fetch associated photos from user_photos table
        let photos: string[] = [];
        try {
          const { data: photosData, error: photosError } = await supabase
            .from('user_photos')
            .select('photo_url')
            .eq('user_email', userProfile.email)
            .order('photo_order', { ascending: true });

          if (photosError) {
          } else if (photosData) {
            photos = photosData.map(p => p.photo_url);
          }
        } catch (photosError) {
        }

        // Fetch interests from interests table
        let interests: string[] = [];
        try {
          interests = await InterestsService.getUserInterests(userProfile.email);
        } catch (interestsError) {
        }

        // Combine profile data, photos, and interests
        const fullProfile: FullProfile = {
          ...userProfile,
          photos: photos,
          interests: interests,
        };

        setProfile(fullProfile);
      } else {
        setProfile(null);
      }
    } catch (error) {
      setProfile(null);
      toast({
        title: 'Error',
        description: 'Failed to load profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateProfile = useCallback(async (updates: ProfileUpdate) => {
    if (!profile?.email) {
      toast({
        title: 'Error',
        description: 'Cannot update profile, user not found.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      await AuthService.updateProfile(profile.email, updates);

      // Refetch the full profile to get the latest data
      await fetchProfile();

      toast({
        title: 'Profile Updated!',
        description: 'Your changes have been saved successfully.',
      });
    } catch (error) {
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

  return {
    profile,
    loading,
    updateProfile,
    refetch: fetchProfile
  };
}