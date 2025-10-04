import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AuthService, Profile, ProfileUpdate } from '@/lib/auth';
import { InterestsService } from '@/lib/interests-service';
import { supabase } from '@/integrations/supabase/client';

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
      console.log('🔄 Fetching user profile...');

      // First try to get authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      let userEmail = user?.email;

      // If no authenticated user, check localStorage
      if (!userEmail) {
        console.log('⚠️ No authenticated user, checking localStorage...');
        const storedUser = localStorage.getItem('current-user');
        const tempUser = localStorage.getItem('temp-user');

        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            userEmail = parsedUser.email;
            console.log('✅ Found user in current-user:', userEmail);
          } catch (e) {
            console.warn('Error parsing stored user:', e);
          }
        } else if (tempUser) {
          try {
            const parsedTempUser = JSON.parse(tempUser);
            userEmail = parsedTempUser.email;
            console.log('✅ Found user in temp-user:', userEmail);
          } catch (e) {
            console.warn('Error parsing temp user:', e);
          }
        }
      }

      if (!userEmail) {
        console.log('❌ No user email found');
        setLoading(false);
        return;
      }

      console.log('🔍 Fetching profile for:', userEmail);

      // Fetch the main profile data from Supabase
      const userProfile = await AuthService.getUserProfile(userEmail);

      if (userProfile) {
        console.log('✅ Profile fetched successfully:', userProfile);

        // Fetch associated photos from user_photos table
        let photos: string[] = [];
        try {
          const { data: photosData, error: photosError } = await supabase
            .from('user_photos')
            .select('photo_url')
            .eq('user_email', userProfile.email)
            .order('photo_order', { ascending: true });

          if (photosError) {
            console.warn("⚠️ Error fetching user photos:", photosError);
          } else if (photosData) {
            photos = photosData.map(p => p.photo_url);
            console.log('📸 Photos fetched:', photos.length, 'photos');
          }
        } catch (photosError) {
          console.warn("⚠️ Exception fetching photos:", photosError);
        }

        // Fetch interests from interests table
        let interests: string[] = [];
        try {
          interests = await InterestsService.getUserInterests(userProfile.email);
          console.log('🎯 Interests fetched:', interests.length, 'interests');
        } catch (interestsError) {
          console.warn("⚠️ Exception fetching interests:", interestsError);
        }

        // Combine profile data, photos, and interests
        const fullProfile: FullProfile = {
          ...userProfile,
          photos: photos,
          interests: interests,
        };

        setProfile(fullProfile);
        console.log('✅ Full profile set with photos and interests');
      } else {
        console.log('❌ No profile found for:', userEmail);
        setProfile(null);
      }
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
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
      console.log('📝 Updating profile with:', updates);
      await AuthService.updateProfile(profile.email, updates);

      // Refetch the full profile to get the latest data
      await fetchProfile();

      toast({
        title: 'Profile Updated!',
        description: 'Your changes have been saved successfully.',
      });
      console.log('✅ Profile updated successfully');
    } catch (error) {
      console.error('❌ Error updating profile:', error);
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