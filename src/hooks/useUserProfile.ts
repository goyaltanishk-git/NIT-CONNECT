// src/hooks/useUserProfile.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AuthService, Profile, ProfileUpdate } from '@/lib/auth';
import { InterestsService } from '@/lib/interests-service';
import { supabase, syncAppSession } from '@/integrations/supabase/client'; 
import { encryptedStorage } from '@/utils/encryptedStorage';
import { PhotoService } from '@/lib/photoservice';

export type FullProfile = Profile & {
  photos: string[];
  interests: string[];
};

const PROFILE_CACHE_PREFIX = 'user-full-profile-cache-v2';

// Fast In-Memory Cache (0ms instantaneous retrieval)
let memoryProfileCache: { email: string; data: FullProfile; timestamp: number } | null = null;

export function getCachedProfileSync(userEmail?: string): FullProfile | null {
  try {
    let email = userEmail;
    if (!email) {
      const stored = encryptedStorage.get('current-user') || localStorage.getItem('temp-user');
      if (stored) {
        email = JSON.parse(stored).email;
      }
    }
    if (!email) return null;

    // 1. Check in-memory cache
    if (memoryProfileCache && memoryProfileCache.email.toLowerCase() === email.toLowerCase()) {
      return memoryProfileCache.data;
    }

    // 2. Check encryptedStorage persistent cache
    const cachedStr = encryptedStorage.get(`${PROFILE_CACHE_PREFIX}-${email.toLowerCase()}`);
    if (cachedStr) {
      const parsed = JSON.parse(cachedStr) as FullProfile;
      if (parsed && parsed.email) {
        memoryProfileCache = { email: parsed.email, data: parsed, timestamp: Date.now() };
        return parsed;
      }
    }

    // 3. Fallback to basic current-user storage for instant UI
    const basicStored = encryptedStorage.get('current-user');
    if (basicStored) {
      const basic = JSON.parse(basicStored) as Profile;
      if (basic && basic.email) {
        const minimal: FullProfile = {
          ...basic,
          photos: (basic as any).photos || [],
          interests: (basic as any).interests || [],
        };
        return minimal;
      }
    }
  } catch {
    // ignore parse errors
  }
  return null;
}

export function updateProfileCacheSync(updated: FullProfile): void {
  try {
    if (!updated?.email) return;
    const lowerEmail = updated.email.toLowerCase();
    memoryProfileCache = { email: lowerEmail, data: updated, timestamp: Date.now() };
    encryptedStorage.set(`${PROFILE_CACHE_PREFIX}-${lowerEmail}`, JSON.stringify(updated));
    encryptedStorage.set('current-user', JSON.stringify(updated));
  } catch {
    // ignore cache write errors
  }
}

export function useUserProfile() {
  // Initialize with cached profile synchronously for 0ms initial load
  const initialCacheRef = useRef<FullProfile | null>(null);
  if (!initialCacheRef.current) {
    initialCacheRef.current = getCachedProfileSync();
  }

  const [profile, setProfile] = useState<FullProfile | null>(() => initialCacheRef.current);
  const [loading, setLoading] = useState<boolean>(() => !initialCacheRef.current);
  const { toast } = useToast();
  const isFetchingRef = useRef(false);

  const fetchProfile = useCallback(async (skipLoadingState = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      let userEmail: string | undefined;

      const storedUser = encryptedStorage.get('current-user');
      const tempUser = localStorage.getItem('temp-user');

      if (storedUser) {
        userEmail = JSON.parse(storedUser).email;
      } else if (tempUser) {
        userEmail = JSON.parse(tempUser).email;
      }

      if (!userEmail) {
        setProfile(null);
        setLoading(false);
        isFetchingRef.current = false;
        return;
      }

      // If we don't have any cached profile in state, show loading spinner
      if (!skipLoadingState && !profile && !memoryProfileCache) {
        setLoading(true);
      }

      // --- 1. SINGLE ROUNDTRIP FAST RPC: get_full_profile ---
      // get_full_profile is SECURITY DEFINER and returns profile + photos + interests in 1 query
      let fullProfile: FullProfile | null = null;

      try {
        const { data: rpcData, error: rpcErr } = await (supabase as any).rpc('get_full_profile', {
          p_email: userEmail
        });

        if (!rpcErr && rpcData) {
          const rawPhotos = Array.isArray(rpcData.photos) ? rpcData.photos : [];
          const normalizedPhotos: string[] = rawPhotos
            .map((p: any) => (typeof p === 'string' ? p : (p?.photo_url || p?.url || '')))
            .filter(Boolean);

          const rawInterests = Array.isArray(rpcData.interests) ? rpcData.interests : [];

          fullProfile = {
            ...rpcData,
            photos: normalizedPhotos,
            interests: rawInterests,
          };
        }
      } catch (e) {
        console.warn('[useUserProfile] get_full_profile RPC failed, trying fallbacks:', e);
      }

      // --- 2. FALLBACK STRATEGY IF RPC NOT AVAILABLE ---
      if (!fullProfile) {
        const userProfile = await AuthService.getUserProfile(userEmail);
        if (userProfile) {
          const [interests, userPhotos] = await Promise.all([
            InterestsService.getUserInterests(userProfile.email).catch(() => []),
            PhotoService.getUserPhotos(userProfile.email).catch(() => []),
          ]);

          const photoUrls = (userPhotos || [])
            .map((p: any) => (typeof p === 'string' ? p : (p?.photo_url || p?.url || '')))
            .filter(Boolean);

          fullProfile = {
            ...userProfile,
            photos: photoUrls,
            interests: interests || [],
          };
        }
      }

      if (fullProfile) {
        // If the new fetch returned empty photos but our existing cache has photos,
        // preserve the cached photos to prevent temporary photo flicker
        if (fullProfile.photos.length === 0 && profile?.photos && profile.photos.length > 0) {
          fullProfile.photos = profile.photos;
        }

        updateProfileCacheSync(fullProfile);
        setProfile(fullProfile);
      }
    } catch (error) {
      console.error('[useUserProfile] fetchProfile error:', error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [profile]);

  const updateProfile = useCallback(async (updates: ProfileUpdate) => {
    let email = profile?.email;
    if (!email) {
      const stored = encryptedStorage.get('current-user');
      if (stored) email = JSON.parse(stored).email;
    }
    if (!email) return;

    setLoading(true);
    try {
      // Optimistically update local state & cache immediately
      if (profile) {
        const optimistic: FullProfile = { ...profile, ...updates };
        setProfile(optimistic);
        updateProfileCacheSync(optimistic);
      }

      await syncAppSession(email).catch(() => {});
      const updated = await AuthService.updateProfile(email, updates);
      
      if (updated) {
        const merged: FullProfile = {
          ...(profile || ({} as FullProfile)),
          ...updated,
          photos: profile?.photos || [],
          interests: profile?.interests || [],
        };
        updateProfileCacheSync(merged);
        setProfile(merged);
      }

      toast({ title: 'Success', description: 'Profile updated.' });
    } catch (error: any) {
      console.error('[useUserProfile] updateProfile error:', error);
      toast({ title: 'Error', description: error?.message || 'Update failed.', variant: 'destructive' });
      // Revert from backend on error
      await fetchProfile(true);
    } finally {
      setLoading(false);
    }
  }, [profile, fetchProfile, toast]);

  useEffect(() => {
    // SWR pattern: we already have initial cached data if available.
    // Trigger background revalidation quietly without showing a blocking loading spinner.
    fetchProfile(!!profile);
  }, []);

  return { profile, loading, updateProfile, refetch: () => fetchProfile(false) };
}   