// src/hooks/useUserProfile.ts
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AuthService, Profile, ProfileUpdate } from '@/lib/auth';
import { InterestsService } from '@/lib/interests-service';
import { supabase } from '@/integrations/supabase/client';
import { encryptedStorage } from '@/utils/encryptedStorage';

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
      let userEmail: string | undefined;

      // ✅ FIX: Check both current and temp storage for setup flow
      const storedUser = encryptedStorage.get('current-user');
      const tempUser = localStorage.getItem('temp-user');

      if (storedUser) {
        userEmail = JSON.parse(storedUser).email;
      } else if (tempUser) {
        userEmail = JSON.parse(tempUser).email;
      }

      // ✅ FALLBACK: For manually inserted users with no local storage
      if (!userEmail) {
        const { data: recent } = await supabase
          .from('profiles')
          .select('email')
          .eq('is_active', false)
          .order('last_active_at', { ascending: false })
          .limit(1)
          .single();
        
        if (recent) userEmail = recent.email;
      }

      if (!userEmail) {
        setLoading(false);
        return;
      }

      const userProfile = await AuthService.getUserProfile(userEmail);

      if (userProfile) {
        const [{ data: photosData }, interests] = await Promise.all([
          supabase.from('user_photos').select('photo_url').eq('user_email', userProfile.email).order('photo_order', { ascending: true }),
          InterestsService.getUserInterests(userProfile.email)
        ]);

        const fullProfile: FullProfile = {
          ...userProfile,
          photos: photosData?.map(p => p.photo_url) || [],
          interests: interests || [],
        };

        setProfile(fullProfile);
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (updates: ProfileUpdate) => {
    if (!profile?.email) return;
    setLoading(true);
    try {
      await AuthService.updateProfile(profile.email, updates);
      await fetchProfile();
      toast({ title: 'Success', description: 'Profile updated.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Update failed.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [profile, fetchProfile, toast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, updateProfile, refetch: fetchProfile };
}