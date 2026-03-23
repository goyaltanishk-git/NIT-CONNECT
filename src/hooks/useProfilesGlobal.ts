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
  is_dating?: boolean | null;
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

export function useProfilesGlobal(selectedColleges: string[] = [], enabled: boolean = true): UseProfilesGlobalReturn {
  const [profiles, setProfiles] = useState<ExtendedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [availableColleges, setAvailableColleges] = useState<string[]>([]);
  const { toast } = useToast();

  // Helper to fetch list of available colleges (including user's college)
  const fetchAvailableColleges = useCallback(async () => {
    try {
      if (!enabled) {
        setAvailableColleges([]);
        return;
      }

      const userd = encryptedStorage.get('current-user');
      if (!userd) return;
      const user = JSON.parse(userd);

      // Fetch all unique colleges
      const { data: colleges, error: collegesError } = await supabase
        .from("profiles")
        .select("college")
        .eq("is_active", true)
        .eq("is_verified", true)
        .eq("is_dating", true);

      if (collegesError) throw collegesError;

      const uniqueColleges = [...new Set(colleges?.map(c => c.college) || [])];
      // Filter OUT the user's own college from the available list
      const otherColleges = uniqueColleges.filter(c => c !== user.college).sort();
      setAvailableColleges(otherColleges);
    } catch (err) {
      console.error('Failed to fetch colleges:', err);
    }
  }, [enabled]);

  const fetchProfilesWithExtendedData = async (currentOffset: number, append: boolean) => {
    try {
      if (!enabled) {
        setProfiles([]);
        setHasMore(false);
        return;
      }

      const stored = encryptedStorage.get("current-user");
      if (!stored) return;
      const currentUser = JSON.parse(stored);

      const cleanColleges = selectedColleges
        .map((college) => college.trim())
        .filter(Boolean);

      const { data, error: fetchError } = await (supabase as any).rpc('get_global_profiles_v2', {
        p_email: currentUser.email,
        p_offset: currentOffset,
        p_limit: PROFILES_PER_BATCH,
        p_selected_colleges: cleanColleges.length > 0 ? cleanColleges : null,
      });
      if (fetchError) throw fetchError;

      const fetchedProfiles = (Array.isArray(data) ? data : []) as ExtendedProfile[];

      if (fetchedProfiles.length === 0) {
        if (append) {
          setProfiles((prev) => prev);
        } else {
          setProfiles([]);
        }
        setHasMore(false);
        return;
      }

      // Format data
      const extendedProfiles: ExtendedProfile[] = fetchedProfiles.map((profile: any) => ({
        ...profile,
        photos: Array.isArray(profile.photos) ? profile.photos : [],
        interests: Array.isArray(profile.interests) ? profile.interests : [],
        age: profile.age,
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
    if (!enabled) {
      setProfiles([]);
      setLoading(false);
      setError(null);
      setOffset(0);
      setHasMore(false);
      return;
    }

    setLoading(true);
    setError(null);
    setOffset(0);
    setHasMore(true);
    try {
      await fetchProfilesWithExtendedData(0, false);
    } finally {
      setLoading(false);
    }
  }, [selectedColleges, enabled]); // Re-fetch when college filter changes

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
  }, [offset, hasMore, loading, selectedColleges, enabled]);

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