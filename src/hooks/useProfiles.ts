// @/hooks/useProfiles.ts
import { useState, useEffect, useCallback } from "react";
import { supabase, syncAppSession } from "@/integrations/supabase/client"; // Added syncAppSession
import { useToast } from "@/hooks/use-toast";
import { encryptedStorage } from "@/utils/encryptedStorage"

export interface DatabaseProfile {
  email: string;
  first_name: string;
  last_name: string;
  gender: string;
  interested_in: string;
  date_of_birth: string;
  bio: string | null;
  hometown: string | null;
  year_of_study: string | null;
  branch: string | null;
  height: number | null;
  instagram_handle: string | null;
  phone_number: string | null;
  verification_status: string | null;
  verification_document_url: string | null;
  is_verified: boolean | null;
  is_active: boolean | null;
  incognito_mode: boolean | null;
  hide_year_branch: boolean | null;
  latitude: number | null;
  longitude: number | null;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  college: string;
}

export interface ExtendedProfile extends DatabaseProfile {
  photos: Array<{ url: string; order: number }>;
  interests: Array<string>;
  age?: number;
  name?: string;
}

const PROFILES_PER_BATCH = 10;

export function useProfiles() {
  const [profiles, setProfiles] = useState<ExtendedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();

  const fetchProfilesWithExtendedData = async (currentOffset: number, append: boolean) => {
    try {
      const stored = encryptedStorage.get("current-user");
      if (!stored) return;
      const currentUser = JSON.parse(stored);

      // ✅ HANDSHAKE: Sync session before fetching any profile or photo data
      await syncAppSession(currentUser.email);

      // Fetch interactions to exclude swiped profiles
      const { data: interactions } = await supabase
        .from('user_interactions')
        .select('target_user_id')
        .eq('user_id', currentUser.email);

      const swipedUserIds = interactions?.map(i => i.target_user_id) || [];

      // Query profiles based on preferences
      let query = supabase
        .from('profiles')
        .select('*')
        .neq('email', currentUser.email)
        .eq('is_active', true)
        .eq('gender', currentUser.interested_in);

      if (swipedUserIds.length > 0) {
        query = query.not('email', 'in', `(${swipedUserIds.join(',')})`);
      }

      const { data: profilesData, error: profilesError } = await query
        .range(currentOffset, currentOffset + PROFILES_PER_BATCH - 1);

      if (profilesError) throw profilesError;

      const extendedProfiles = await Promise.all((profilesData || []).map(async (profile) => {
        // These requests now work because of the Handshake performed above
        const [photosRes, interestsRes] = await Promise.all([
          supabase.from('user_photos').select('photo_url, photo_order').eq('user_email', profile.email).order('photo_order'),
          supabase.from('user_interests').select('interest').eq('user_email', profile.email)
        ]);

        const today = new Date();
        const birthDate = new Date(profile.date_of_birth);
        let age = today.getFullYear() - birthDate.getFullYear();
        if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) {
          age--;
        }

        return {
          ...profile,
          photos: (photosRes.data || []).map(p => ({ url: p.photo_url, order: p.photo_order })),
          interests: (interestsRes.data || []).map(i => i.interest),
          age,
          name: profile.first_name
        };
      }));

      if (append) {
        setProfiles(prev => [...prev, ...extendedProfiles]);
      } else {
        setProfiles(extendedProfiles);
      }

      setHasMore(extendedProfiles.length === PROFILES_PER_BATCH);
    } catch (err) {
      console.error('Fetch profiles error:', err);
      setError('Failed to fetch profiles');
    }
  };

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    await fetchProfilesWithExtendedData(0, false);
    setLoading(false);
  }, []);

  const fetchNextBatch = useCallback(async () => {
    if (!hasMore || loading) return;
    setLoading(true);
    const nextOffset = offset + PROFILES_PER_BATCH;
    await fetchProfilesWithExtendedData(nextOffset, true);
    setOffset(nextOffset);
    setLoading(false);
  }, [offset, hasMore, loading]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  return { profiles, loading, error, hasMore, fetchNextBatch, refetch: fetchProfiles };
}