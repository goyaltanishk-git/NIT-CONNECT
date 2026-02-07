// @/hooks/useProfilesGlobal.ts
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client"; 
import { useToast } from "@/hooks/use-toast";
import { encryptedStorage } from "@/utils/encryptedStorage";

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
  college: string; 
}

export interface ExtendedProfile extends DatabaseProfile {
  photos: Array<{ url: string; order: number }>;
  interests: Array<string>;
  age?: number;
  name?: string;
}

interface UseProfilesGlobalReturn {
  profiles: ExtendedProfile[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  fetchNextBatch: () => Promise<void>;
  hasMore: boolean;
  availableColleges: string[];
}

const PROFILES_PER_BATCH = 10;

export function useProfilesGlobal(selectedColleges: string[] = []): UseProfilesGlobalReturn {
  const [profiles, setProfiles] = useState<ExtendedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [availableColleges, setAvailableColleges] = useState<string[]>([]);
  const { toast } = useToast();

  // Helper to fetch list of available colleges
  const fetchAvailableColleges = useCallback(async () => {
    try {
      const userd = encryptedStorage.get('current-user');
      if (!userd) return;
      const user = JSON.parse(userd);

      // We still use a standard query here as it's just a list of colleges
      // Race condition matters less for non-sensitive data, but RPC is safer if you want later
      const { data: colleges, error: collegesError } = await supabase
        .from("profiles")
        .select("college")
        .neq("college", user.college)
        .eq("is_active", true);

      if (collegesError) throw collegesError;

      const uniqueColleges = [...new Set(colleges?.map(c => c.college) || [])];
      setAvailableColleges(uniqueColleges.sort());
    } catch (err) {
      console.error("Error fetching colleges:", err);
    }
  }, []);

  const fetchProfilesWithExtendedData = async (currentOffset: number, append: boolean) => {
    try {
      const stored = encryptedStorage.get("current-user");
      if (!stored) return;
      const currentUser = JSON.parse(stored);

      // ✅ Use RPC to fetch Global profiles atomically
      const { data, error: fetchError } = await supabase.rpc('get_global_profiles', {
        p_email: currentUser.email,
        p_offset: currentOffset,
        p_limit: PROFILES_PER_BATCH,
        p_selected_colleges: selectedColleges.length > 0 ? selectedColleges : null
      });

      if (fetchError) throw fetchError;

      const fetchedProfiles = (data as any[]) || [];

      // Format data
      const extendedProfiles: ExtendedProfile[] = fetchedProfiles.map(profile => ({
        ...profile,
        photos: profile.photos.map((p: any) => ({ url: p.url, order: p.order })),
        interests: profile.interests,
        age: profile.age, // Age is now calculated in SQL
        name: profile.first_name
      }));

      if (append) {
        setProfiles(prev => [...prev, ...extendedProfiles]);
      } else {
        setProfiles(extendedProfiles);
      }

      setHasMore(extendedProfiles.length === PROFILES_PER_BATCH);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profiles';
      setError(errorMessage);
      toast({
        title: 'Error Loading Profiles',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    setOffset(0);
    setHasMore(true);
    try {
      await fetchProfilesWithExtendedData(0, false);
    } finally {
      setLoading(false);
    }
  }, [selectedColleges]); // Re-fetch when college filter changes

  const fetchNextBatch = useCallback(async () => {
    if (!hasMore || loading) return;
    setLoading(true);
    try {
      const nextOffset = offset + PROFILES_PER_BATCH;
      await fetchProfilesWithExtendedData(nextOffset, true);
      setOffset(nextOffset);
    } finally {
      setLoading(false);
    }
  }, [offset, hasMore, loading, selectedColleges]);

  const refetch = useCallback(async () => {
    setOffset(0);
    setHasMore(true);
    await fetchProfiles();
  }, [fetchProfiles]);

  useEffect(() => {
    fetchAvailableColleges();
  }, [fetchAvailableColleges]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  return { profiles, loading, error, refetch, fetchNextBatch, hasMore, availableColleges };
}