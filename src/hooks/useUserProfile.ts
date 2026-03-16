// src/hooks/useUserProfile.ts
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AuthService, Profile, ProfileUpdate } from '@/lib/auth';
import { InterestsService } from '@/lib/interests-service';
import { supabase, syncAppSession } from '@/integrations/supabase/client'; 
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
        // Fetch interests (no RLS session needed)
        const interests = await InterestsService.getUserInterests(userProfile.email);

        // ✅ FIX: Retry loop for photos — Supabase uses a connection pool, so
        // syncAppSession (SET session variable) and the photos query can land on
        // DIFFERENT connections, making RLS block the query silently.
        // Each retry re-syncs AND re-queries together, maximising the chance they
        // share the same connection.
        let photosData: { photo_url: string }[] | null = null;
        const MAX_RETRIES = 4;
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
          await syncAppSession(userProfile.email);
          const { data } = await supabase
            .from('user_photos')
            .select('photo_url')
            .eq('user_email', userProfile.email)
            .order('photo_order', { ascending: true });

          if (data && data.length > 0) {
            photosData = data;
            break; // got photos — stop retrying
          }
          // Got 0 rows — could be a pool miss; wait briefly before next attempt
          if (attempt < MAX_RETRIES - 1) {
            await new Promise(resolve => setTimeout(resolve, 80));
          }
        }

        const fullProfile: FullProfile = {
          ...userProfile,
          photos: photosData?.map(p => p.photo_url) || [],
          interests: interests || [],
        };

        setProfile(fullProfile);
      }
    } catch (error) {
      
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // @/hooks/useUserProfile.ts

const updateProfile = useCallback(async (updates: ProfileUpdate) => {
  if (!profile?.email) return;
  setLoading(true);
  try {
    // ✅ Ensure the session is synced before updating
    await syncAppSession(profile.email);

    // If AuthService.updateProfile uses supabase.from('profiles').update()
    // Ensure it includes .select() at the end of the query to avoid 406
    await AuthService.updateProfile(profile.email, updates);
    
    await fetchProfile();
    toast({ title: 'Success', description: 'Profile updated.' });
  } catch (error: any) {
   
    toast({ title: 'Error', description: 'Update failed.', variant: 'destructive' });
  } finally {
    setLoading(false);
  }
}, [profile?.email, fetchProfile, toast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, updateProfile, refetch: fetchProfile };
}   