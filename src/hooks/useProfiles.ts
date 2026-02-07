// @/hooks/useProfiles.ts
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  is_verified: boolean | null;
  is_active: boolean | null;
  incognito_mode: boolean | null;
  hide_year_branch: boolean | null;
  college: string;
}

export interface ExtendedProfile extends DatabaseProfile {
  photos: Array<{ url: string; order: number }>;
  interests: Array<string>;
  age: number;
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

      // ✅ Use RPC to fetch profiles atomically (Prevents Race Condition)
      const { data, error } = await supabase.rpc('get_discovery_profiles', {
        p_email: currentUser.email,
        p_offset: currentOffset,
        p_limit: PROFILES_PER_BATCH
      });

      if (error) throw error;

      // The RPC returns properly formatted JSON, but we cast it to our type
      // We also handle the case where data might be null (though the RPC handles coalesce)
      const fetchedProfiles = (data as any[]) || [];

      // Map to ensure types match exactly if needed (RPC returns 'photos' as array of objects)
      const formatted: ExtendedProfile[] = fetchedProfiles.map((p: any) => ({
        ...p,
        // Ensure photos map correctly just in case
        photos: p.photos.map((ph: any) => ({ url: ph.url, order: ph.order })),
        interests: p.interests
      }));

      setProfiles(prev => append ? [...prev, ...formatted] : formatted);
      setHasMore(formatted.length === PROFILES_PER_BATCH);
      
    } catch (err: any) {
      console.error('Discovery fetch error:', err);
      setError(err.message);
    }
  };

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    await fetchProfilesWithExtendedData(0, false);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  return { 
    profiles, 
    loading, 
    error, 
    hasMore, 
    refetch: fetchProfiles 
  };
}